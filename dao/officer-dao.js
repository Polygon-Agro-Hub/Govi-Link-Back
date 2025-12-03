const uploadFileToS3 = require('../Middlewares/s3upload');
const db = require('../startup/database');

exports.getOfficerVisitsCombined = async (officerId) => {
  console.log("Fetching all visits for Officer ID:", officerId);

  const query = (sql, params) => 
    new Promise((resolve, reject) => {
      db.plantcare.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

  try {
    // ✅ Visits (Pending audits + govilink jobs)
    const visitsSql = `
      SELECT * FROM (
        SELECT 
          fau.jobId AS jobId,
          fau.id AS id,
          fau.propose AS propose,
          NULL AS serviceenglishName,
          NULL AS servicesinhalaName,
          NULL AS servicetamilName,
          "feildaudits" AS auditType,
          CASE 
            WHEN cp.userId IS NOT NULL THEN CONCAT(ps.firstName, ' ', ps.lastName)
            WHEN cp.clusterId IS NOT NULL THEN fc.clsName
            ELSE NULL
          END AS farmerName,
          CASE
            WHEN cp.userId IS NOT NULL THEN ps.phoneNumber
            ELSE NULL
          END AS farmerMobile,
          CASE 
            WHEN cp.userId IS NOT NULL THEN cp.userId
            ELSE NULL
          END AS farmerId,
          CASE 
            WHEN cp.payType = 'Crop' THEN ocs.longitude
            ELSE NULL
          END AS longitude,
          CASE 
            WHEN cp.payType = 'Crop' THEN ocs.latitude
            ELSE NULL
          END AS latitude,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.district
            WHEN cp.payType = 'Farm' THEN ffarm.district
            ELSE NULL
          END AS district,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.plotNo
            WHEN cp.payType = 'Farm' THEN ffarm.plotNo
            ELSE NULL
          END AS plotNo,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.street
            WHEN cp.payType = 'Farm' THEN ffarm.street
            ELSE NULL
          END AS street,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.city
            WHEN cp.payType = 'Farm' THEN ffarm.city
            ELSE NULL
          END AS city,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.id
            WHEN cp.payType = 'Farm' THEN ffarm.id
            ELSE NULL
          END AS farmId,
          cp.certificateId,
          cp.clusterId,
          cp.id AS certificationpaymentId,
          fau.sheduleDate AS sheduleDate
        FROM feildaudits AS fau
        LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
        LEFT JOIN users AS ps ON cp.userId = ps.id
        LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
        LEFT JOIN certificationpaymentcrop AS cpc ON cp.id = cpc.paymentId
        LEFT JOIN certificationpaymentfarm AS cpf ON cp.id = cpf.paymentId
        LEFT JOIN ongoingcultivationscrops AS ocs ON cpc.cropId = ocs.id
        LEFT JOIN farms AS fcrop ON ocs.farmId = fcrop.id
        LEFT JOIN farms AS ffarm ON cpf.farmId = ffarm.id
        WHERE fau.assignOfficerId = ?
          AND DATE(fau.sheduleDate) = CURDATE()
          AND fau.status = 'Pending'
          AND (
            cp.clusterId IS NOT NULL
            OR NOT EXISTS (
              SELECT 1
              FROM slavequestionnaire AS sq
              LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
              WHERE sq.crtPaymentId = cp.id
                AND (slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> ''))
            )
          )

        UNION ALL

        SELECT 
          glj.jobId AS jobId,
          glj.id AS id,
          "Requested" AS propose,
          os.englishName AS serviceenglishName,
          os.sinhalaName AS servicesinhalaName,
          os.tamilName AS servicetamilName,
          "govilinkjobs" AS auditType,
          CONCAT(ps2.firstName, ' ', ps2.lastName) AS farmerName,
          ps2.phoneNumber AS farmerMobile,
          ps2.id AS farmerId,
          NULL AS longitude,
          NULL AS latitude,
          f.district,
          f.plotNo,
          f.street,
          f.city,
          f.id AS farmId,
          NULL AS certificateId,
          NULL AS clusterId,
          NULL AS certificationpaymentId,
          glj.sheduleDate AS sheduleDate
        FROM jobassignofficer AS jao
        LEFT JOIN govilinkjobs AS glj ON jao.jobId = glj.id
        LEFT JOIN users AS ps2 ON glj.farmerId = ps2.id
        LEFT JOIN officerservices AS os ON glj.serviceId = os.id
        LEFT JOIN farms AS f ON glj.farmId = f.id
        WHERE jao.officerId = ?
          AND DATE(glj.sheduleDate) = CURDATE()
          AND jao.isActive = 1
          AND glj.status = 'Pending'
          AND NOT EXISTS (
              SELECT 1
              FROM govijoblinksuggestions AS gjs
              WHERE gjs.jobId = glj.id
          )
      ) AS combinedResults
      ORDER BY combinedResults.sheduleDate DESC
    `;

    // ✅ Draft individual audits
    const draftSql = `
      SELECT 
        fau.id,
        fau.jobId,
        fau.propose AS propose,
        cp.userId AS farmerId,
        cp.id AS certificationpaymentId,
        CONCAT(gcu.firstName, ' ', gcu.lastName) AS farmerName,
        gcu.phoneNumber AS farmerMobile,
        COUNT(slqi.id) AS totalTasks,
        SUM(CASE WHEN slqi.officerTickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,
        SUM(CASE WHEN slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,
        SUM(
          CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
        ) AS totalCompleted,
        ROUND(
          (SUM(
            CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
          ) / COUNT(slqi.id)) * 100, 1
        ) AS completionPercentage
      FROM feildaudits AS fau
      LEFT JOIN certificationpayment AS cp ON cp.id = fau.paymentId
      LEFT JOIN slavequestionnaire AS sq ON sq.crtPaymentId = cp.id
      LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
      LEFT JOIN users AS gcu ON cp.userId = gcu.id
      WHERE 
        fau.assignOfficerId = ? 
        AND fau.status = 'Pending'
        AND DATE(fau.sheduleDate) = CURDATE()
        AND cp.clusterId IS NULL
      GROUP BY fau.id, fau.jobId, cp.userId, fau.status
      HAVING (completionPercentage < 100 AND completionPercentage > 0) OR (completionPercentage = 100 AND fau.status = 'Pending')
      ORDER BY completionPercentage ASC;
    `;

    // ✅ Draft cluster audits
    const clusterSql = `
      SELECT 
        fau.id,
        fau.jobId,
        fau.propose AS propose,
        cp.userId AS farmerId,
        cp.id AS certificationpaymentId,
        CONCAT(ps.firstName, ' ', ps.lastName) AS farmerName,
        ps.phoneNumber AS farmerMobile,
        cp.clusterId,
        f.id AS farmId,
        SUM(CASE WHEN slqi.officerTickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,
        SUM(CASE WHEN slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,
        SUM(
          CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
        ) AS totalCompleted,
        ROUND(
          (SUM(
            CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
          ) / COUNT(slqi.id)) * 100, 1
        ) AS completionPercentage
      FROM feildaudits AS fau
      LEFT JOIN feildauditcluster AS fauc ON fauc.feildAuditId = fau.id
      LEFT JOIN farms AS f ON f.id = fauc.farmId
      LEFT JOIN farmclusterfarmers AS fcf ON fcf.farmId = f.id
      LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
      LEFT JOIN users AS ps ON f.userId = ps.id
      LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
      LEFT JOIN slavequestionnaire AS sq ON fcf.id = sq.clusterFarmId
      LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
      WHERE 
        fau.assignOfficerId = ? 
        AND fauc.isCompleted = 0
        AND DATE(fau.sheduleDate) = CURDATE()
        AND cp.clusterId IS NOT NULL
      GROUP BY fau.id, fau.jobId, cp.userId, fau.status, ps.firstName, ps.lastName, ps.phoneNumber, f.id, fcf.id
      HAVING (completionPercentage < 100 AND completionPercentage > 0) OR (completionPercentage = 100 AND fau.status = 'Pending')
      ORDER BY completionPercentage ASC;
    `;

    // ✅ Draft govilink jobs
    const requestSql = `
      SELECT 
        glj.jobId AS jobId,
        glj.id AS id,
        "Requested" AS propose,
        os.englishName AS serviceenglishName,
        os.sinhalaName AS servicesinhalaName,
        os.tamilName AS servicetamilName,
        "govilinkjobs" AS auditType,
        CONCAT(ps2.firstName, ' ', ps2.lastName) AS farmerName,
        ps2.phoneNumber AS farmerMobile,
        glj.sheduleDate AS sheduleDate,
        CASE
          WHEN gjs.id IS NOT NULL AND gjp.id IS NOT NULL THEN 100
          WHEN gjs.id IS NOT NULL AND gjp.id IS NULL THEN 50
          ELSE 0
        END AS completionPercentage
      FROM jobassignofficer AS jao
      LEFT JOIN govilinkjobs AS glj ON jao.jobId = glj.id
      LEFT JOIN users AS ps2 ON glj.farmerId = ps2.id
      LEFT JOIN officerservices AS os ON glj.serviceId = os.id
      LEFT JOIN farms AS f ON glj.farmId = f.id
      LEFT JOIN govijoblinksuggestions AS gjs ON gjs.jobId = glj.id
      LEFT JOIN govijoblinkproblems AS gjp ON gjp.jobId = glj.id
      WHERE jao.officerId = ?
        AND DATE(glj.sheduleDate) = CURDATE()
        AND jao.isActive = 1
        AND glj.status = 'Pending'
      HAVING completionPercentage > 0 AND completionPercentage <= 100
    `;

    // ✅ Execute all queries in parallel
    const [visits, draftVisits, clusterVisits, requestVisits] = await Promise.all([
      query(visitsSql, [officerId, officerId]),
      query(draftSql, [officerId]),
      query(clusterSql, [officerId]),
      query(requestSql, [officerId])
    ]);

    // Combine draft visits
    const combinedDrafts = [...draftVisits, ...clusterVisits, ...requestVisits];

    return {
      visits,
      draftVisits: combinedDrafts
    };

  } catch (err) {
    console.error("Error fetching officer visits:", err);
    throw err;
  }
};



exports.getofficerVisits = async (officerId) => {
  console.log("Officer ID:", officerId);

  return new Promise((resolve, reject) => {
 const sql = `
      SELECT * FROM (
        SELECT 
          fau.jobId AS jobId,
          fau.id AS id,
          fau.propose AS propose,
          NULL AS serviceenglishName,
          NULL AS servicesinhalaName,
          NULL AS servicetamilName,
          "feildaudits" AS auditType,
          CASE 
            WHEN cp.userId IS NOT NULL THEN CONCAT(ps.firstName, ' ', ps.lastName)
            WHEN cp.clusterId IS NOT NULL THEN fc.clsName
            ELSE NULL
          END AS farmerName,
              CASE
            WHEN cp.userId IS NOT NULL THEN ps.phoneNumber
            ELSE NULL
          END AS farmerMobile,
          CASE 
            WHEN cp.userId IS NOT NULL THEN cp.userId
            ELSE NULL
          END AS farmerId,
          CASE 
            WHEN cp.payType = 'Crop' THEN ocs.longitude
            ELSE NULL
          END AS longitude,
          CASE 
            WHEN cp.payType = 'Crop' THEN ocs.latitude
            ELSE NULL
          END AS latitude,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.district
            WHEN cp.payType = 'Farm' THEN ffarm.district
            ELSE NULL
          END AS district,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.plotNo
            WHEN cp.payType = 'Farm' THEN ffarm.plotNo
            ELSE NULL
          END AS plotNo,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.street
            WHEN cp.payType = 'Farm' THEN ffarm.street
            ELSE NULL
          END AS street,
          CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.city
            WHEN cp.payType = 'Farm' THEN ffarm.city
            ELSE NULL
          END AS city,
                    CASE 
            WHEN cp.payType = 'Crop' THEN fcrop.id
            WHEN cp.payType = 'Farm' THEN ffarm.id
            ELSE NULL
          END AS farmId,
          cp.certificateId,
          cp.clusterId,
          cp.id AS certificationpaymentId,
          fau.sheduleDate AS sheduleDate
        FROM feildaudits AS fau
        LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
        LEFT JOIN users AS ps ON cp.userId = ps.id
        LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
        LEFT JOIN certificationpaymentcrop AS cpc ON cp.id = cpc.paymentId
        LEFT JOIN certificationpaymentfarm AS cpf ON cp.id = cpf.paymentId
        LEFT JOIN ongoingcultivationscrops AS ocs ON cpc.cropId = ocs.id
        LEFT JOIN farms AS fcrop ON ocs.farmId = fcrop.id
        LEFT JOIN farms AS ffarm ON cpf.farmId = ffarm.id
        WHERE fau.assignOfficerId = ?
          AND DATE(fau.sheduleDate) = CURDATE()
          AND fau.status = 'Pending'
AND (
  cp.clusterId IS NOT NULL
  OR NOT EXISTS (
      SELECT 1
      FROM slavequestionnaire AS sq
      LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
      WHERE sq.crtPaymentId = cp.id
        AND (slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> ''))
  )
)

        UNION ALL

        SELECT 
          glj.jobId AS jobId,
          glj.id AS id,
          "Requested" AS propose,
          os.englishName AS serviceenglishName,
          os.sinhalaName AS servicesinhalaName,
          os.tamilName AS servicetamilName,
          "govilinkjobs" AS auditType,
          CONCAT(ps2.firstName, ' ', ps2.lastName) AS farmerName,
          ps2.phoneNumber AS farmerMobile,
          ps2.id AS farmerId,
          NULL AS longitude,
          NULL AS latitude,
          f.district,
          f.plotNo,
          f.street,
          f.city,
          f.id AS farmId,
          NULL AS certificateId,
          NULL AS clusterId,
          NULL AS certificationpaymentId,
          glj.sheduleDate AS sheduleDate
        FROM jobassignofficer AS jao
        LEFT JOIN govilinkjobs AS glj ON jao.jobId = glj.id
        LEFT JOIN users AS ps2 ON glj.farmerId = ps2.id
        LEFT JOIN officerservices AS os ON glj.serviceId = os.id
        LEFT JOIN farms AS f ON glj.farmId = f.id
        WHERE jao.officerId = ?
          AND DATE(glj.sheduleDate) = CURDATE()
          AND jao.isActive = 1
          AND glj.status = 'Pending'
                  AND NOT EXISTS (
              SELECT 1
              FROM govijoblinksuggestions AS gjs
              WHERE gjs.jobId = glj.id
          )
      ) AS combinedResults
      ORDER BY combinedResults.sheduleDate DESC
    `;

    db.plantcare.query(sql, [officerId, officerId], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return reject(new Error("Database error"));
      }

      if (results.length === 0) {
        console.log('No data found for officer:', officerId);
        return reject(new Error("No pending visits found for today"));
      }

      resolve(results);
    });
  });
};


exports.getofficerVisitsDraft = async (officerId) => {
  console.log("Officer ID for draft percentage:", officerId);

  return new Promise((resolve, reject) => {
    const individualSql = `
      SELECT 
      fau.id,
        fau.jobId,
        fau.propose AS propose,
        cp.userId AS farmerId,
        cp.id AS certificationpaymentId,
        CONCAT( gcu.firstName, ' ',  gcu.lastName) AS farmerName,
        gcu.phoneNumber AS farmerMobile,
        COUNT(slqi.id) AS totalTasks,
        SUM(CASE WHEN slqi.officerTickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,
        SUM(CASE WHEN slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,
        SUM(
          CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
        ) AS totalCompleted,
        ROUND(
          (SUM(
            CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
          ) / COUNT(slqi.id)) * 100, 1
        ) AS completionPercentage
      FROM feildaudits AS fau
      LEFT JOIN certificationpayment AS cp ON cp.id = fau.paymentId
      LEFT JOIN slavequestionnaire AS sq ON sq.crtPaymentId = cp.id
      LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
      LEFT JOIN users AS gcu ON cp.userId = gcu.id
      WHERE 
        fau.assignOfficerId = ? 
        AND fau.status = 'Pending'
        AND DATE(fau.sheduleDate) = CURDATE()
        AND cp.clusterId IS NULL
      GROUP BY fau.id, fau.jobId, cp.userId,  fau.status
      HAVING completionPercentage < 100 AND  completionPercentage > 0 OR (completionPercentage = 100 AND fau.status = 'Pending')
      ORDER BY completionPercentage ASC;
    `;

    const clusterSql = `
  SELECT 
  fau.id,
    fau.jobId,
    fau.propose AS propose,
    cp.userId AS farmerId,
    cp.id AS certificationpaymentId,
    CONCAT(ps.firstName, ' ', ps.lastName) AS farmerName,
    ps.phoneNumber AS farmerMobile,
    cp.clusterId ,
    f.id AS farmId,
    SUM(CASE WHEN slqi.officerTickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,
    SUM(CASE WHEN slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,
    SUM(
      CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
    ) AS totalCompleted,
    ROUND(
      (SUM(
        CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
      ) / COUNT(slqi.id)) * 100, 1
    ) AS completionPercentage
  FROM feildaudits AS fau
  LEFT JOIN feildauditcluster AS fauc ON fauc.feildAuditId = fau.id
  LEFT JOIN farms AS f ON f.id = fauc.farmId
  LEFT JOIN farmclusterfarmers AS fcf ON fcf.farmId = f.id
  LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
  LEFT JOIN users AS ps ON f.userId = ps.id
  LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
  LEFT JOIN slavequestionnaire AS sq ON fcf.id = sq.clusterFarmId
  LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
  WHERE 
    fau.assignOfficerId = ? 
    AND fauc.isCompleted = 0
    AND DATE(fau.sheduleDate) = CURDATE()
    AND cp.clusterId IS NOT NULL
  GROUP BY fau.id, fau.jobId, cp.userId, fau.status, ps.firstName, ps.lastName, ps.phoneNumber, f.id, fcf.id
  HAVING completionPercentage < 100  AND  completionPercentage > 0 OR (completionPercentage = 100 AND fau.status = 'Pending')
  ORDER BY completionPercentage ASC;
`;
const requestSql = `
  SELECT 
    glj.jobId AS jobId,
    glj.id AS id,
    "Requested" AS propose,
    os.englishName AS serviceenglishName,
    os.sinhalaName AS servicesinhalaName,
    os.tamilName AS servicetamilName,
    "govilinkjobs" AS auditType,
    CONCAT(ps2.firstName, ' ', ps2.lastName) AS farmerName,
    ps2.phoneNumber AS farmerMobile,
    glj.sheduleDate AS sheduleDate,

    -- ✅ Completion logic
    CASE
      WHEN gjs.id IS NOT NULL AND gjp.id IS NOT NULL THEN 100
      WHEN gjs.id IS NOT NULL AND gjp.id IS NULL THEN 50
      ELSE 0
    END AS completionPercentage

        FROM jobassignofficer AS jao
        LEFT JOIN govilinkjobs AS glj ON jao.jobId = glj.id
  LEFT JOIN users AS ps2 ON glj.farmerId = ps2.id
  LEFT JOIN officerservices AS os ON glj.serviceId = os.id
  LEFT JOIN farms AS f ON glj.farmId = f.id

  -- ✅ Check for suggestion and problem existence
  LEFT JOIN govijoblinksuggestions AS gjs ON gjs.jobId = glj.id
  LEFT JOIN govijoblinkproblems AS gjp ON gjp.jobId = glj.id

  WHERE jao.officerId = ?
    AND DATE(glj.sheduleDate) = CURDATE()
    AND jao.isActive = 1
    AND glj.status = 'Pending'
    HAVING completionPercentage > 0 AND completionPercentage <= 100
`;


db.plantcare.query(individualSql, [officerId], (err1, individualResults) => {
  if (err1) return reject(err1);

  db.plantcare.query(clusterSql, [officerId], (err2, clusterResults) => {
    if (err2) return reject(err2);

    db.plantcare.query(requestSql, [officerId], (err3, requestResults) => {
      if (err3) return reject(err3);

      const results = [
        ...individualResults,
        ...clusterResults,
        ...requestResults,
      ];
      console.log("✅ Draft Jobs Found:", results);
      resolve(results);
    });
  });
});
  });
};

// exports.getofficerVisitsDraft = async (officerId) => {
//   console.log("Officer ID for draft percentage:", officerId);

//   return new Promise((resolve, reject) => {
//     const individualSql = `
//       SELECT 
//       fau.id,
//         fau.jobId,
//         fau.propose AS propose,
//         cp.userId AS farmerId,
//         cp.id AS certificationpaymentId,
//         CONCAT( gcu.firstName, ' ',  gcu.lastName) AS farmerName,
//         gcu.phoneNumber AS farmerMobile,
//         COUNT(slqi.id) AS totalTasks,
//         SUM(CASE WHEN slqi.officerTickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,
//         SUM(CASE WHEN slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,
//         SUM(
//           CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
//         ) AS totalCompleted,
//         ROUND(
//           (SUM(
//             CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
//           ) / COUNT(slqi.id)) * 100, 1
//         ) AS completionPercentage
//       FROM feildaudits AS fau
//       LEFT JOIN certificationpayment AS cp ON cp.id = fau.paymentId
//       LEFT JOIN slavequestionnaire AS sq ON sq.crtPaymentId = cp.id
//       LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
//       LEFT JOIN users AS gcu ON cp.userId = gcu.id
//       WHERE 
//         fau.assignOfficerId = ? 
//         AND fau.status = 'Pending'
//         AND DATE(fau.sheduleDate) = CURDATE()
//         AND cp.clusterId IS NULL
//       GROUP BY fau.id, fau.jobId, cp.userId,  fau.status
//       HAVING completionPercentage < 100 AND  completionPercentage > 0 OR (completionPercentage = 100 AND fau.status = 'Pending')
//       ORDER BY completionPercentage ASC;
//     `;

//     const clusterSql = `
//   SELECT 
//   fau.id,
//     fau.jobId,
//     fau.propose AS propose,
//     cp.userId AS farmerId,
//     cp.id AS certificationpaymentId,
//     CONCAT(ps.firstName, ' ', ps.lastName) AS farmerName,
//     ps.phoneNumber AS farmerMobile,
//     cp.clusterId ,
//     f.id AS farmId,
//     SUM(CASE WHEN slqi.officerTickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,
//     SUM(CASE WHEN slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,
//     SUM(
//       CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
//     ) AS totalCompleted,
//     ROUND(
//       (SUM(
//         CASE WHEN slqi.officerTickResult = 1 OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') THEN 1 ELSE 0 END
//       ) / COUNT(slqi.id)) * 100, 1
//     ) AS completionPercentage
//   FROM feildaudits AS fau
//   LEFT JOIN feildauditcluster AS fauc ON fauc.feildAuditId = fau.id
//   LEFT JOIN farms AS f ON f.id = fauc.farmId
//   LEFT JOIN farmclusterfarmers AS fcf ON fcf.farmId = f.id
//   LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
//   LEFT JOIN users AS ps ON f.userId = ps.id
//   LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
//   LEFT JOIN slavequestionnaire AS sq ON fcf.id = sq.clusterFarmId
//   LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
//   WHERE 
//     fau.assignOfficerId = ? 
//     AND fauc.isCompleted = 0
//     AND DATE(fau.sheduleDate) = CURDATE()
//     AND cp.clusterId IS NOT NULL
//   GROUP BY fau.id, fau.jobId, cp.userId, fau.status, ps.firstName, ps.lastName, ps.phoneNumber, f.id, fcf.id
//   HAVING completionPercentage < 100  AND  completionPercentage > 0 OR (completionPercentage = 100 AND fau.status = 'Pending')
//   ORDER BY completionPercentage ASC;
// `;


//     // Execute both queries
//     db.plantcare.query(individualSql, [officerId], (err1, individualResults) => {
//       if (err1) {
//         console.error("❌ Database error (individual jobs):", err1.message);
//         return reject(err1);
//       }

//       db.plantcare.query(clusterSql, [officerId], (err2, clusterResults) => {
//         if (err2) {
//           console.error("❌ Database error (cluster jobs):", err2.message);
//           return reject(err2);
//         }

//         // Merge results
//         const results = [...individualResults, ...clusterResults];
//         console.log("✅ Draft Jobs Found:",results );
//         resolve(results);
//       });
//     });
//   });
// };

exports.getindividualauditsquestions = async (certificationpaymentId, farmId,clusterId) => { 
  console.log("certification payment ID:", certificationpaymentId, "clusterId:", clusterId, "farmId:", farmId);

  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        slqi.*,
        c.logo,
        c.srtName,
        c.createdAt,
        sq.id AS slavequestionnaireId,
        c.id AS certificateId
      FROM slavequestionnaireitems AS slqi
      LEFT JOIN slavequestionnaire AS sq ON slqi.slaveId = sq.id
      LEFT JOIN certificationpayment AS cp ON sq.crtPaymentId = cp.id
      LEFT JOIN certificates AS c ON cp.certificateId = c.id
      LEFT JOIN farmclusterfarmers AS fcf ON sq.clusterFarmId = fcf.id 
      WHERE sq.crtPaymentId = ?
    `;

    const params = [certificationpaymentId];

    if (clusterId != null && farmId != null) {
      sql += " AND fcf.clusterId = ? AND fcf.farmId = ?";
      params.push(clusterId, farmId);
    }

    db.plantcare.query(sql, params, (err, results) => {
      if (err) {
        console.error("❌ Database error:", err.message);
        return reject(new Error("Database error while fetching questions"));
      }

      if (results.length === 0) {
        console.log("⚠️ No questions found for:", certificationpaymentId, clusterId, farmId);
        return reject(new Error("No questions found for this certification payment"));
      }

      // Extract certificate info
      const first = results[0];
      const certificate = {
        logo: first.logo || null,
        srtName: first.srtName || "",
        createdAt: first.createdAt || null,
        slavequestionnaireId: first.slavequestionnaireId || null,
        certificateId: first.certificateId || null
      };

      // Extract questions only
      const questions = results.map(({ logo, srtName, createdAt, slavequestionnaireId, certificateId, ...rest }) => rest);

      console.log("✅ Questions count:", questions.length);
      resolve({ certificate, questions });
    });
  });
};


exports.setCheckQuestions = async (id) => {
  console.log("DAO: Toggling tickResult for question ID:", id);

  return new Promise((resolve, reject) => {
    // Step 1: Get current tickResult
    const selectSql = `
      SELECT officerTickResult
      FROM slavequestionnaireitems 
      WHERE id = ?
    `;

    db.plantcare.query(selectSql, [id], (err, results) => {
      if (err) {
        console.error("❌ Database error (select):", err.message);
        return reject(new Error("Database error while fetching current tickResult"));
      }

      if (results.length === 0) {
        console.warn("⚠️ No question found with ID:", id);
        return reject(new Error("Question not found"));
      }

      const currentTick = results[0].officerTickResult || 0;
      const newTick = currentTick === 1 ? 0 : 1;

      // Step 2: Update with toggled value
      const updateSql = `
        UPDATE slavequestionnaireitems
        SET officerTickResult = ?
        WHERE id = ?
      `;

      db.plantcare.query(updateSql, [newTick, id], (err2, result) => {
        if (err2) {
          console.error("❌ Database error (update):", err2.message);
          return reject(new Error("Database error while updating tickResult"));
        }

        if (result.affectedRows === 0) {
          console.warn("⚠️ Update failed, no rows affected for ID:", id);
          return reject(new Error("Question not found or not updated"));
        }

        console.log(`✅ tickResult toggled successfully for question ${id} → ${newTick}`);
        resolve({ id, newTick });
      });
    });
  });
};

exports.getexistingTaskImageImage = async (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT officerUploadImage
      FROM slavequestionnaireitems
      WHERE id = ?
      LIMIT 1
    `;

    db.plantcare.query(sql, [id], (err, results) => {
      if (err) {
        console.error("❌ Database error:", err.message);
        return reject(new Error("Database error while fetching existing task image"));
      }

      if (!results || results.length === 0) {
        console.warn("⚠️ No question found with ID:", id);
        return resolve(null);
      }

      // ✅ Return the first result
      resolve(results[0]);
    });
  });
};


exports.setCheckPhotoProof = async (id, uploadImage) => {
  console.log("DAO: Updating tickResult and uploadImage for question ID:", id);

  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE slavequestionnaireitems
      SET officerUploadImage = ?
      WHERE id = ?
    `;

    db.plantcare.query(sql, [ uploadImage, id], (err, result) => {
      if (err) {
        console.error("❌ Database error:", err.message);
        return reject(new Error("Database error while updating tickResult"));
      }

      if (result.affectedRows === 0) {
        console.warn("⚠️ No question found with ID:", id);
        return reject(new Error("Question not found"));
      }

      console.log("✅ tickResult updated successfully for question:", id);
      resolve(result);
    });
  });
};

exports.clearPhotoProofImage = async (id) => {
  console.log("DAO: Clearing photo proof for question ID:", id);
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE slavequestionnaireitems
      SET officerUploadImage = NULL
      WHERE id = ?
    `;
    db.plantcare.query(sql, [id], (err, result) => {
      if (err) {
        console.error("❌ DB error clearing photo proof:", err.message);
        return reject(new Error("Database error while clearing photo proof"));
      }
      resolve(result);
    });
  });
};


exports.setsaveProblem = async (payload, officerId) => {
  console.log("DAO: Saving problem → Payload:", payload);

  return new Promise((resolve, reject) => {
    const { problem, solution, slavequestionnaireId } = payload;

    if (!officerId) {
      console.error("❌ Missing officerId");
      return reject(new Error("Invalid officerId"));
    }

    // Step 1: Check if officer exists in feildofficer table
    const checkSql = `SELECT id FROM feildofficer WHERE id = ?`;
    db.plantcare.query(checkSql, [officerId], (checkErr, rows) => {
      if (checkErr) {
        console.error("❌ DB error checking officer:", checkErr.message);
        return reject(new Error("Database error while checking officer"));
      }

      if (rows.length === 0) {
        console.error("❌ Officer not found in feildofficer table:", officerId);
        return reject(new Error(`Officer with ID ${officerId} not found`));
      }

      // Step 2: Proceed with insert into jobsuggestions
      const insertSql = `
        INSERT INTO jobsuggestions (slaveId, problem, solution, officerId, createdAt)
        VALUES (?, ?, ?, ?, NOW())
      `;

      db.plantcare.query(insertSql, [slavequestionnaireId, problem, solution, officerId], (err, result) => {
        if (err) {
          console.error("❌ DB error inserting problem:", err.message);
          return reject(new Error("Database error while saving problem"));
        }

        console.log("✅ Problem saved successfully → ID:", result.insertId);
        resolve({ id: result.insertId });
      });
    });
  });
};

exports.getProblemsSolutionsBySlaveId = async (slaveId) => {
  console.log("DAO: Fetching problems for slaveId →", slaveId);

  return new Promise((resolve, reject) => {
    if (!slaveId) {
      console.error("❌ Missing slaveId");
      return reject(new Error("Invalid slaveId"));
    }

    const sql = `
      SELECT id, problem, solution, createdAt
      FROM jobsuggestions
      WHERE slaveId = ?
        ORDER BY createdAt ASC
    `;

    db.plantcare.query(sql, [slaveId], (err, results) => {
      if (err) {
        console.error("❌ DB error fetching problems:", err.message);
        return reject(new Error("Database error while fetching problems"));
      }

      console.log("✅ Problems fetched successfully → Count:", results.length);
      resolve(results);
    });
  });
};

exports.updateProblem = async (id, payload) => {
  console.log("DAO: Updating problem → ID:", id, "| Payload:", payload);

  return new Promise((resolve, reject) => {
    const { problem, solution } = payload;

    if (!id ) {
      console.error("❌ Missing id or officerId");
      return reject(new Error("Invalid input"));
    }

    const updateSql = `
      UPDATE jobsuggestions
      SET problem = ?, solution = ?
      WHERE id = ? 
    `;

    db.plantcare.query(updateSql, [problem, solution, id], (err, result) => {
      if (err) {
        console.error("❌ DB error updating problem:", err.message);
        return reject(new Error("Database error while updating problem"));
      }

      if (result.affectedRows === 0) {
        return reject(new Error("Problem not found or not authorized to update"));
      }

      console.log("✅ Problem updated successfully → ID:", id);
      resolve({ id });
    });
  });
};



exports.setcomplete = async (id, payload) => {
  console.log("DAO: Updating problem → ID:", id, "| Payload:", payload);

  const { isClusterAudit, farmId } = payload;

  return new Promise((resolve, reject) => {
    if (!id) return reject(new Error("Audit ID is required"));

    // CASE 1: Non-cluster audit → directly mark feildaudit as completed
    if (!isClusterAudit) {
      const sql = `UPDATE feildaudits SET status = 'Completed', completeDate = NOW() WHERE id = ?`;
      db.plantcare.query(sql, [id], (err, result) => {
        if (err) {
          console.error("❌ DB error updating feildaudit:", err.message);
          return reject(new Error("Database error while updating feildaudit"));
        }
        if (result.affectedRows === 0) {
          return reject(new Error("Audit not found or already completed"));
        }
        console.log(`✅ feildaudit ${id} marked as Completed`);
        return resolve({ success: true, message: "Audit marked as completed" });
      });
    }

    // CASE 2: Cluster audit → update farmclusterfarms first
    else {
      const sqlUpdateFarm = `
        UPDATE feildauditcluster 
        SET isCompleted = 1 
        WHERE feildAuditId = ? AND farmId = ?
      `;

      db.plantcare.query(sqlUpdateFarm, [id, farmId], (err, result) => {
        if (err) {
          console.error("❌ DB error updating farmclusterfarmers:", err.message);
          return reject(new Error("Database error while updating farm completion"));
        }

        if (result.affectedRows === 0) {
          return reject(new Error("Farm not found or already completed"));
        }

        console.log(`✅ Farm ${farmId} marked complete for audit ${id}`);

        // Now check if all farms in this audit are complete
        const sqlCheckAll = `
          SELECT COUNT(*) AS total, 
                 SUM(CASE WHEN isCompleted = 1 THEN 1 ELSE 0 END) AS completed
          FROM feildauditcluster
          WHERE feildAuditId = ?
        `;

        db.plantcare.query(sqlCheckAll, [id], (err, rows) => {
          if (err) {
            console.error("❌ DB error checking farm completion:", err.message);
            return reject(new Error("Database error while verifying cluster completion"));
          }

          const { total, completed } = rows[0];
          console.log(`🔍 Cluster audit ${id}: ${completed}/${total} farms completed`);

          if (total === completed) {
            // All farms completed → mark feildaudit as completed
            const sqlUpdateAudit = `
              UPDATE feildaudits SET status = 'Completed', completeDate = NOW() WHERE id = ?
            `;
            db.plantcare.query(sqlUpdateAudit, [id], (err2, result2) => {
              if (err2) {
                console.error("❌ DB error updating feildaudit:", err2.message);
                return reject(new Error("Database error while completing feildaudit"));
              }
              console.log(`🏁 Cluster audit ${id} fully completed`);
              return resolve({ success: true, message: "Cluster audit fully completed" });
            });
          } else {
            return resolve({ success: true, message: "Farm marked complete, cluster still pending" });
          }
        });
      });
    }
  });
};


exports.getVisitsbydate = async (officerId, date, isOverdueSelected) => {
  console.log("Officer ID:", officerId, "Date:", date, "isOverdue:", isOverdueSelected);

  return new Promise((resolve, reject) => {
    // Format date as YYYY-MM-DD
    const formatDate = (d) => {
      const dt = new Date(d);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const selectedDateString = formatDate(date);
    const isOverdue = (isOverdueSelected === true || isOverdueSelected === "true");

    console.log("✔ isOverdue:", isOverdue);

    // Dynamic conditions
    // const dateCondition = isOverdue
    //   ? "DATE(fau.sheduleDate) < DATE(CURDATE()) AND fau.status = 'Pending'"
    //   : "DATE(fau.sheduleDate) = ?";

const dateCondition = isOverdue
  ? `
    DATE(fau.sheduleDate) < DATE(CURDATE()) 
    AND fau.status = 'Pending'
    AND (
      cp.clusterId IS NULL 
      OR (
          (
            SELECT ROUND(
              (
                (SELECT COUNT(*) FROM feildauditcluster AS fauc 
                  WHERE fauc.feildAuditId = fau.id AND fauc.isCompleted = 1)
                /
                (SELECT COUNT(*) FROM feildauditcluster AS fauc 
                  WHERE fauc.feildAuditId = fau.id)
              ) * 100, 0
            )
          ) < 20
      )
    )
  `
  : "DATE(fau.sheduleDate) = ? AND (fau.status = 'Pending' OR fau.status = 'Completed')";


    const gljDateCondition = isOverdue
      ? "DATE(glj.sheduleDate) < DATE(CURDATE())  AND jao.isActive = 1 AND glj.status = 'Pending'"
      :"DATE(glj.sheduleDate) = ? AND (glj.status = 'Pending' OR glj.status = 'Completed')";

    console.log("FAU condition:", dateCondition);
    console.log("GLJ condition:", gljDateCondition);

    // Main SQL
    const sql = `
      SELECT * FROM (
        SELECT 
          fau.jobId, fau.id, fau.propose, NULL AS serviceenglishName, NULL AS servicesinhalaName, NULL AS servicetamilName,
          fau.status,
          "feildaudits" AS auditType,
          CASE WHEN cp.userId IS NOT NULL THEN CONCAT(ps.firstName,' ',ps.lastName) 
               WHEN cp.clusterId IS NOT NULL THEN fc.clsName END AS farmerName,
          CASE WHEN cp.userId IS NOT NULL THEN ps.phoneNumber END AS farmerMobile,
          CASE WHEN cp.userId IS NOT NULL THEN cp.userId END AS farmerId,
          CASE WHEN cp.payType='Crop' THEN ocs.longitude END AS longitude,
          CASE WHEN cp.payType='Crop' THEN ocs.latitude END AS latitude,
CASE 
  WHEN cp.clusterId IS NOT NULL THEN fc.district
  WHEN cp.payType = 'Crop' THEN fcrop.district
  WHEN cp.payType = 'Farm' THEN ffarm.district
END AS district,
          CASE WHEN cp.payType='Crop' THEN fcrop.plotNo WHEN cp.payType='Farm' THEN ffarm.plotNo END AS plotNo,
          CASE WHEN cp.payType='Crop' THEN fcrop.street WHEN cp.payType='Farm' THEN ffarm.street END AS street,
          CASE WHEN cp.payType='Crop' THEN fcrop.city WHEN cp.payType='Farm' THEN ffarm.city END AS city,
          CASE WHEN cp.payType='Crop' THEN fcrop.id WHEN cp.payType='Farm' THEN ffarm.id END AS farmId,
          cp.certificateId, cp.clusterId, cp.id AS certificationpaymentId,
          fau.sheduleDate,
              CASE 
      WHEN cp.clusterId IS NOT NULL THEN (
        SELECT COUNT(*)
        FROM feildauditcluster AS fauc
        WHERE fauc.feildAuditId = fau.id
          AND fauc.isCompleted = 1
      )
      ELSE NULL
    END AS completedClusterCount,
        CASE 
      WHEN cp.clusterId IS NOT NULL THEN (
        SELECT COUNT(*)
        FROM feildauditcluster AS fauc
        WHERE fauc.feildAuditId = fau.id
      )
      ELSE NULL
    END AS totalClusterCount,
    CASE
  WHEN cp.clusterId IS NOT NULL THEN (
    CASE
      WHEN 
        (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId = fau.id) = 0
      THEN 0
      ELSE ROUND(
        (
          (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId = fau.id AND fauc.isCompleted = 1)
          /
          (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId = fau.id)
        ) * 100
      , 0)
    END
  )
  ELSE NULL
END AS completionPercentage

        FROM feildaudits AS fau
        LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
        LEFT JOIN users AS ps ON cp.userId = ps.id
        LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
        LEFT JOIN certificationpaymentcrop AS cpc ON cp.id = cpc.paymentId
        LEFT JOIN certificationpaymentfarm AS cpf ON cp.id = cpf.paymentId
        LEFT JOIN ongoingcultivationscrops AS ocs ON cpc.cropId = ocs.id
        LEFT JOIN farms AS fcrop ON ocs.farmId = fcrop.id
        LEFT JOIN farms AS ffarm ON cpf.farmId = ffarm.id
        WHERE fau.assignOfficerId = ?
          AND ${dateCondition}
          AND fau.sheduleDate IS NOT NULL
      ) AS fa

      UNION ALL

      SELECT * FROM (
        SELECT 
          glj.jobId, glj.id, "Requested" AS propose, os.englishName, os.sinhalaName, os.tamilName,
          glj.status,
          "govilinkjobs" AS auditType,
          CONCAT(ps2.firstName,' ',ps2.lastName) AS farmerName, ps2.phoneNumber AS farmerMobile, ps2.id AS farmerId,
          NULL AS longitude, NULL AS latitude,
          f.district, f.plotNo, f.street, f.city, f.id AS farmId,
          NULL AS certificateId, NULL AS clusterId, NULL AS certificationpaymentId,
          glj.sheduleDate,
          NULL AS completedClusterCount,
          NULL AS totalClusterCount,
          NULL AS completionPercentage
        FROM jobassignofficer AS jao
        LEFT JOIN govilinkjobs AS glj ON jao.jobId = glj.id
        LEFT JOIN users AS ps2 ON glj.farmerId = ps2.id
        LEFT JOIN officerservices AS os ON glj.serviceId = os.id
        LEFT JOIN farms AS f ON glj.farmId = f.id
        WHERE jao.officerId = ?
          AND ${gljDateCondition} 
          AND glj.sheduleDate IS NOT NULL
      ) AS glj_combined

      ORDER BY sheduleDate DESC
    `;

    // Correct parameters depending on overdue or date selection
    let params;

    if (isOverdue) {
      params = [officerId, officerId];
    } else {
      params = [officerId, selectedDateString, officerId, selectedDateString];
    }

    console.log("SQL Params:", params);

    db.plantcare.query(sql, params, (err, results) => {
      if (err) return reject(new Error("Database error: " + err.message));
      console.log("✅ Visits fetched successfully → Count:", results.length);
      resolve(results);
      console.log({ results });
    });
  });
};

// Get field officers with optional search
exports.getFieldOfficers = async (irmId, search = '') => {
    return new Promise((resolve, reject) => {
        let sql = `
            SELECT 
                firstName,
                firstNameSinhala,
                firstNameTamil,
                lastName,
                lastNameSinhala,
                lastNameTamil,
                empId,
                status,
                profile
            FROM feildofficer 
            WHERE irmId = ?
        `;

        const queryParams = [irmId];

        if (search && search.trim() !== '') {
            sql += `
                AND (
                    firstName LIKE ? OR 
                    firstNameSinhala LIKE ? OR 
                    firstNameTamil LIKE ? OR 
                    lastName LIKE ? OR 
                    lastNameSinhala LIKE ? OR 
                    lastNameTamil LIKE ? OR 
                    empId LIKE ? OR 
                    status LIKE ?
                )
            `;

            const searchPattern = `%${search}%`;
            for (let i = 0; i < 8; i++) {
                queryParams.push(searchPattern);
            }
        }

        sql += ` ORDER BY createdAt DESC`;

        db.plantcare.query(sql, queryParams, (err, results) => {
            if (err) {
                return reject(new Error("Database error"));
            }

            resolve({
                data: results,
                count: results.length
            });
        });
    });
};

// Create a new field officer
exports.createFieldOfficer = async (irmId, officerData, files) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Convert assignDistrict array to string for database
            const assignDistrictString = Array.isArray(officerData.assignDistrict) 
                ? officerData.assignDistrict.join(', ') 
                : officerData.assignDistrict;

            // Handle languages conversion - convert to comma-separated string
            let languageString = "";
            if (typeof officerData.languages === 'string') {
                try {
                    // Parse the JSON string
                    const languagesObj = JSON.parse(officerData.languages);
                    // Convert to comma-separated string of selected languages
                    languageString = Object.keys(languagesObj)
                        .filter(lang => languagesObj[lang])
                        .join(', ');
                } catch (error) {
                    languageString = officerData.languages;
                }
            } else if (typeof officerData.languages === 'object') {
                // If it's already an object, convert to comma-separated string
                languageString = Object.keys(officerData.languages)
                    .filter(lang => officerData.languages[lang])
                    .join(', ');
            }

            // Generate employee ID
            const generateEmployeeId = () => {
                return new Promise((resolve, reject) => {
                    // First, get the latest employee ID from the database
                    const getLatestIdQuery = `
                        SELECT empId FROM feildofficer 
                        WHERE empId LIKE 'FIO%' 
                        ORDER BY id DESC 
                        LIMIT 1
                    `;
                    
                    db.plantcare.query(getLatestIdQuery, (err, results) => {
                        if (err) {
                            console.error("Error getting latest employee ID:", err.message);
                            return reject(new Error("Database error while generating employee ID"));
                        }

                        let nextNumber = 1; // Default starting number

                        if (results.length > 0) {
                            const latestEmpId = results[0].empId;
                            if (latestEmpId && latestEmpId.startsWith('FIO')) {
                                // Extract the number part and increment
                                const numberPart = latestEmpId.substring(3); // Remove 'FIO' prefix
                                const currentNumber = parseInt(numberPart, 10);
                                if (!isNaN(currentNumber)) {
                                    nextNumber = currentNumber + 1;
                                }
                            }
                        }

                        // Format the number with leading zeros (5 digits total)
                        const formattedNumber = nextNumber.toString().padStart(5, '0');
                        const newEmpId = `FIO${formattedNumber}`;
                        
                        resolve(newEmpId);
                    });
                });
            };

            // Generate the employee ID
            const empId = await generateEmployeeId();
            const jobRole = "Field Officer"; // Always set to Field Officer

            // Upload files to S3 if they exist
            let profileUrl = null;
            let frontNicUrl = null;
            let backNicUrl = null;
            let backPassbookUrl = null;
            let contractUrl = null;

            // Upload profile image if provided
            if (files.profile && files.profile[0]) {
                profileUrl = await uploadFileToS3(
                    files.profile[0].buffer,
                    files.profile[0].originalname,
                    'field-officer/profile'
                );
            }

            if (files.frontNic && files.frontNic[0]) {
                frontNicUrl = await uploadFileToS3(
                    files.frontNic[0].buffer,
                    files.frontNic[0].originalname,
                    'field-officer/front-nic'
                );
            }

            if (files.backNic && files.backNic[0]) {
                backNicUrl = await uploadFileToS3(
                    files.backNic[0].buffer,
                    files.backNic[0].originalname,
                    'field-officer/back-nic'
                );
            }

            if (files.backPassbook && files.backPassbook[0]) {
                backPassbookUrl = await uploadFileToS3(
                    files.backPassbook[0].buffer,
                    files.backPassbook[0].originalname,
                    'field-officer/passbooks'
                );
            }

            if (files.contract && files.contract[0]) {
                contractUrl = await uploadFileToS3(
                    files.contract[0].buffer,
                    files.contract[0].originalname,
                    'field-officer/contracts'
                );
            }

            // Check for existing NIC, email, and phone numbers
            const checkExistingQuery = `
                SELECT id FROM feildofficer 
                WHERE nic = ? OR email = ? OR (phoneCode1 = ? AND phoneNumber1 = ?)
            `;

            db.plantcare.query(
                checkExistingQuery, 
                [
                    officerData.nic, 
                    officerData.email, 
                    officerData.phoneCode1, 
                    officerData.phoneNumber1
                ], 
                (checkErr, checkResults) => {
                    if (checkErr) {
                        console.error("Database check error:", checkErr.message);
                        return reject(new Error("Database error while checking existing records"));
                    }

                    if (checkResults.length > 0) {
                        return reject(new Error("Officer with this NIC, email or phone number already exists"));
                    }

                    // Prepare SQL query - UPDATED with correct number of placeholders (35)
                    const sql = `
                        INSERT INTO feildofficer (
                            irmId, empType, empId, JobRole, language, assignDistrict, firstName, firstNameSinhala, 
                            firstNameTamil, lastName, lastNameSinhala, lastNameTamil, phoneCode1, 
                            phoneNumber1, phoneCode2, phoneNumber2, nic, email, house, street, 
                            city, distrct, province, country, comAmount, accName, accNumber, 
                            bank, branch, profile, frontNic, backNic, backPassbook, contract, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    const values = [
                        irmId, 
                        officerData.empType,
                        empId, // Auto-generated employee ID
                        jobRole, // Always "Field Officer"
                        languageString, 
                        assignDistrictString,
                        officerData.firstName,
                        officerData.firstNameSinhala,
                        officerData.firstNameTamil,
                        officerData.lastName,
                        officerData.lastNameSinhala,
                        officerData.lastNameTamil,
                        officerData.phoneCode1,
                        officerData.phoneNumber1,
                        officerData.phoneCode2 || null,
                        officerData.phoneNumber2 || null,
                        officerData.nic,
                        officerData.email,
                        officerData.house,
                        officerData.street,
                        officerData.city,
                        officerData.distrct,
                        officerData.province,
                        officerData.country,
                        officerData.comAmount,
                        officerData.accName,
                        officerData.accNumber,
                        officerData.bank,
                        officerData.branch,
                        profileUrl,
                        frontNicUrl,
                        backNicUrl,
                        backPassbookUrl,
                        contractUrl,
                        'Not Approved' // Default status
                    ];

                    console.log('Executing SQL with values:', values);
                    console.log('Generated Employee ID:', empId);
                    console.log('Job Role:', jobRole);
                    console.log('Number of columns in SQL:', 35); // Count of columns listed
                    console.log('Number of values provided:', values.length); // Should match

                    db.plantcare.query(sql, values, (err, results) => {
                        if (err) {
                            console.error("Database error:", err.message);
                            console.error("SQL:", sql);
                            console.error("Values count:", values.length);
                            
                            // Handle duplicate entry errors
                            if (err.code === 'ER_DUP_ENTRY') {
                                return reject(new Error("Officer with this NIC or email already exists"));
                            }
                            
                            return reject(new Error("Database error: " + err.message));
                        }

                        if (results.affectedRows === 0) {
                            return reject(new Error("Failed to create field officer"));
                        }

                        console.log('Field officer created successfully with ID:', results.insertId);
                        console.log('Employee ID:', empId);
                        
                        resolve({
                            id: results.insertId,
                            empId: empId,
                            jobRole: jobRole,
                            message: "Field officer created successfully."
                        });
                    });
                }
            );

        } catch (error) {
            console.error("Error in createFieldOfficer:", error);
            reject(error);
        }
    });
};

// Check existing NIC
exports.checkNicExists = async (nic) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id FROM feildofficer WHERE nic = ?`;
        
        db.plantcare.query(sql, [nic], (err, results) => {
            if (err) {
                console.error("Database error:", err.message);
                return reject(new Error("Database error"));
            }

            resolve(results.length > 0);
        });
    });
};

// Check existing email
exports.checkEmailExists = async (email) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id FROM feildofficer WHERE email = ?`;
        
        db.plantcare.query(sql, [email], (err, results) => {
            if (err) {
                console.error("Database error:", err.message);
                return reject(new Error("Database error"));
            }

            resolve(results.length > 0);
        });
    });
};

// Check existing phone number
exports.checkPhoneExists = async (phoneCode, phoneNumber) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id FROM feildofficer WHERE phoneCode1 = ? AND phoneNumber1 = ?`;
        
        db.plantcare.query(sql, [phoneCode, phoneNumber], (err, results) => {
            if (err) {
                console.error("Database error:", err.message);
                return reject(new Error("Database error"));
            }

            resolve(results.length > 0);
        });
    });
};
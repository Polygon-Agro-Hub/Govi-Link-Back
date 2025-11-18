const db = require('../startup/database');

// exports.getVisitsbydate = async (irmId, date, isOverdueSelected) => {
//   console.log("IRM ID:", irmId, "Date:", date, "isOverdue:", isOverdueSelected);

//   return new Promise((resolve, reject) => {
//     const formatDate = (d) => {
//       const dt = new Date(d);
//       const yyyy = dt.getFullYear();
//       const mm = String(dt.getMonth() + 1).padStart(2, "0");
//       const dd = String(dt.getDate()).padStart(2, "0");
//       return `${yyyy}-${mm}-${dd}`;
//     };

//     const selectedDateString = formatDate(date);
//     const isOverdue = isOverdueSelected === true || isOverdueSelected === "true";

//     // Step 1: Get all officer IDs for this irmId
//     const officerIdsSql = `SELECT id FROM feildofficer WHERE irmId = ?`;
//     db.plantcare.query(officerIdsSql, [irmId], (err, officers) => {
//       if (err) return reject(new Error("Database error fetching officers: " + err.message));

//       if (!officers.length) return resolve([]); // no officers

//       const officerIds = officers.map(o => o.id);
//      const officerIdsWithIrm = [...officerIds, irmId];
//   console.log("Officer IDs + IRM ID:", officerIdsWithIrm);

      // const dateCondition = isOverdue
      //   ? `
      //     DATE(fau.sheduleDate) < DATE(CURDATE()) AND fau.status = 'Pending'
      //     AND (
      //       cp.clusterId IS NULL OR (
      //         (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId=fau.id AND fauc.isCompleted=1)
      //         /
      //         (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId=fau.id) * 100 < 20
      //       )
      //     )
      //   `
      //   : `DATE(fau.sheduleDate) = ? 
      //             AND (
      //       cp.clusterId IS NULL OR (
      //         (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId=fau.id AND fauc.isCompleted=1)
      //         /
      //         (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId=fau.id) * 100 < 20
      //       )
      //     )
      //   `;

      // const gljDateCondition = isOverdue
      //   ? "DATE(glj.sheduleDate) < DATE(CURDATE()) AND jao.isActive = 1 AND glj.status = 'Pending'"
      //   : "DATE(glj.sheduleDate) = ?";

//       // Step 2: Fetch visits for all officer IDs
//       const sql = `
//         SELECT * FROM (
//            SELECT 
//           fau.jobId, fau.id, fau.propose, NULL AS serviceenglishName, NULL AS servicesinhalaName, NULL AS servicetamilName,
//           fau.status,
//           "feildaudits" AS auditType,
//           CASE WHEN cp.userId IS NOT NULL THEN CONCAT(ps.firstName,' ',ps.lastName) 
//                WHEN cp.clusterId IS NOT NULL THEN fc.clsName END AS farmerName,
//           CASE WHEN cp.userId IS NOT NULL THEN ps.phoneNumber END AS farmerMobile,
//           CASE WHEN cp.userId IS NOT NULL THEN cp.userId END AS farmerId,
//           CASE WHEN cp.payType='Crop' THEN ocs.longitude END AS longitude,
//           CASE WHEN cp.payType='Crop' THEN ocs.latitude END AS latitude,
// CASE 
//   WHEN cp.clusterId IS NOT NULL THEN fc.district
//   WHEN cp.payType = 'Crop' THEN fcrop.district
//   WHEN cp.payType = 'Farm' THEN ffarm.district
// END AS district,
//           CASE WHEN cp.payType='Crop' THEN fcrop.plotNo WHEN cp.payType='Farm' THEN ffarm.plotNo END AS plotNo,
//           CASE WHEN cp.payType='Crop' THEN fcrop.street WHEN cp.payType='Farm' THEN ffarm.street END AS street,
//           CASE WHEN cp.payType='Crop' THEN fcrop.city WHEN cp.payType='Farm' THEN ffarm.city END AS city,
//           CASE WHEN cp.payType='Crop' THEN fcrop.id WHEN cp.payType='Farm' THEN ffarm.id END AS farmId,
//           cp.certificateId, cp.clusterId, cp.id AS certificationpaymentId,
//           fau.sheduleDate,
//               CASE 
//       WHEN cp.clusterId IS NOT NULL THEN (
//         SELECT COUNT(*)
//         FROM feildauditcluster AS fauc
//         WHERE fauc.feildAuditId = fau.id
//           AND fauc.isCompleted = 1
//       )
//       ELSE NULL
//     END AS completedClusterCount,
//         CASE 
//       WHEN cp.clusterId IS NOT NULL THEN (
//         SELECT COUNT(*)
//         FROM feildauditcluster AS fauc
//         WHERE fauc.feildAuditId = fau.id
//       )
//       ELSE NULL
//     END AS totalClusterCount,
//     CASE
//   WHEN cp.clusterId IS NOT NULL THEN (
//     CASE
//       WHEN 
//         (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId = fau.id) = 0
//       THEN 0
//       ELSE ROUND(
//         (
//           (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId = fau.id AND fauc.isCompleted = 1)
//           /
//           (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId = fau.id)
//         ) * 100
//       , 0)
//     END
//   )
//   ELSE NULL
// END AS completionPercentage

//         FROM feildaudits AS fau
//         LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
//         LEFT JOIN users AS ps ON cp.userId = ps.id
//         LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
//         LEFT JOIN certificationpaymentcrop AS cpc ON cp.id = cpc.paymentId
//         LEFT JOIN certificationpaymentfarm AS cpf ON cp.id = cpf.paymentId
//         LEFT JOIN ongoingcultivationscrops AS ocs ON cpc.cropId = ocs.id
//         LEFT JOIN farms AS fcrop ON ocs.farmId = fcrop.id
//         LEFT JOIN farms AS ffarm ON cpf.farmId = ffarm.id
//           WHERE fau.assignOfficerId IN (?)
//           AND ${dateCondition}
//           AND fau.sheduleDate IS NOT NULL
//         ) AS fa

//         UNION ALL

//       SELECT * FROM (
//         SELECT 
//           glj.jobId, glj.id, "Requested" AS propose, os.englishName, os.sinhalaName, os.tamilName,
//           glj.status,
//           "govilinkjobs" AS auditType,
//           CONCAT(ps2.firstName,' ',ps2.lastName) AS farmerName, ps2.phoneNumber AS farmerMobile, ps2.id AS farmerId,
//           NULL AS longitude, NULL AS latitude,
//           f.district, f.plotNo, f.street, f.city, f.id AS farmId,
//           NULL AS certificateId, NULL AS clusterId, NULL AS certificationpaymentId,
//           glj.sheduleDate,
//           NULL AS completedClusterCount,
//           NULL AS totalClusterCount,
//           NULL AS completionPercentage
//         FROM jobassignofficer AS jao
//         LEFT JOIN govilinkjobs AS glj ON jao.jobId = glj.id
//         LEFT JOIN users AS ps2 ON glj.farmerId = ps2.id
//         LEFT JOIN officerservices AS os ON glj.serviceId = os.id
//         LEFT JOIN farms AS f ON glj.farmId = f.id
//           WHERE jao.officerId IN (?)
//           AND ${gljDateCondition}
//           AND glj.sheduleDate IS NOT NULL
//         ) AS glj_combined

//         ORDER BY sheduleDate DESC
//       `;

//       const params = isOverdue ? [officerIdsWithIrm, officerIdsWithIrm] : [officerIdsWithIrm, selectedDateString, officerIdsWithIrm, selectedDateString];
//       console.log("Executing SQL with params:", params);

//       db.plantcare.query(sql, params, (err, results) => {
//         if (err) return reject(new Error("Database error fetching visits: " + err.message));
//         resolve(results);
//                 console.log("✅ Visits fetched successfully → Count:", results);

//       });
//     });
//   });
// };


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
          DATE(fau.sheduleDate) < DATE(CURDATE()) AND fau.status = 'Pending'
          AND (
            cp.clusterId IS NULL OR (
              (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId=fau.id AND fauc.isCompleted=1)
              /
              (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId=fau.id) * 100 < 20
            )
          )
        `
        : `DATE(fau.sheduleDate) = ? 
                  AND (
            cp.clusterId IS NULL OR (
              (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId=fau.id AND fauc.isCompleted=1)
              /
              (SELECT COUNT(*) FROM feildauditcluster AS fauc WHERE fauc.feildAuditId=fau.id) * 100 < 20
            )
          )
        `;

      const gljDateCondition = isOverdue
        ? "DATE(glj.sheduleDate) < DATE(CURDATE()) AND jao.isActive = 1 AND glj.status = 'Pending'"
        : "DATE(glj.sheduleDate) = ?";
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

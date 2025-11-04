const db = require('../startup/database');

exports.getofficerVisits = async (officerId) => {
  console.log("Officer ID:", officerId);

  return new Promise((resolve, reject) => {
    const sql = `
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
        cp.certificateId,
        cp.clusterId,
        fau.createdAt AS createdAt
      FROM feildaudits AS fau
      LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
      LEFT JOIN users AS ps ON cp.userId = ps.id
        LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
        LEFT JOIN certificationpaymentcrop AS cpc ON cp.id=cpc.paymentId
                LEFT JOIN certificationpaymentfarm AS cpf ON cp.id=cpf.paymentId
        LEFT JOIN ongoingcultivationscrops AS ocs ON cpc.cropId= ocs.id
         LEFT JOIN farms AS fcrop ON ocs.farmId = fcrop.id
      LEFT JOIN farms AS ffarm ON cpf.farmId = ffarm.id
      WHERE fau.assignOfficerId = ?
        AND DATE(fau.createdAt) = CURDATE()
        AND fau.status = 'Pending'

      UNION ALL

      SELECT 
        glj.jobId AS jobId,
        jao.id AS id,
        "Requested" AS propose,
        os.englishName AS serviceenglishName,
        os.sinhalaName AS servicesinhalaName,
        os.tamilName AS servicetamilName,
        "govilinkjobs" AS auditType,
        CONCAT(ps2.firstName, ' ', ps2.lastName) AS farmerName,
        ps2.id AS farmerId,
          NULL AS longitude,
        NULL AS latitude,
        f.district,
        f.city,
        f.street,
        f.plotNo,
        NULL AS certificateId,
        NULL AS clusterId,
        jao.createdAt AS createdAt
      FROM jobassignofficer AS jao
      LEFT JOIN govilinkjobs AS glj ON jao.jobId = glj.id
      LEFT JOIN users AS ps2 ON glj.farmerId = ps2.id
      LEFT JOIN officerservices AS os ON glj.serviceId = os.id
      LEFT JOIN farms AS f ON glj.farmId = f.id
      WHERE jao.officerId = ?
        AND DATE(jao.createdAt) = CURDATE()
        AND jao.isActive = 1
        AND glj.status = 'Pending'
      ORDER BY createdAt DESC
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

      console.log("Combined Results:", results);
      resolve(results);
    });
  });
};

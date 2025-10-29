const db = require('../startup/database');

exports.getofficerVisits = async (officerId) => {
  console.log("Officer ID:", officerId);

  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        fau.jobId AS jobId,
        fau.id AS id,
        fau.propose AS propose,
        NULL AS englishName,
        NULL AS sinhalaName,
        NULL AS tamilName,
        "feildaudits" AS auditType,
          CASE 
          WHEN cp.userId IS NOT NULL THEN CONCAT(ps.firstName, ' ', ps.lastName)
          WHEN cp.clusterId IS NOT NULL THEN fc.clsName
          ELSE NULL
        END AS farmerName,
        fau.createdAt AS createdAt
      FROM feildaudits AS fau
      LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
      LEFT JOIN users AS ps ON cp.userId = ps.id
        LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
      WHERE fau.assignOfficerId = ?
        AND DATE(fau.createdAt) = CURDATE()
        AND fau.status = 'Pending'

      UNION ALL

      SELECT 
        glj.jobId AS jobId,
        jao.id AS id,
        NULL AS propose,
        os.englishName AS englishName,
        os.sinhalaName AS sinhalaName,
        os.tamilName AS tamilName,
        "govilinkjobs" AS auditType,
        CONCAT(ps2.firstName, ' ', ps2.lastName) AS farmerName,
        jao.createdAt AS createdAt
      FROM jobassignofficer AS jao
      LEFT JOIN govilinkjobs AS glj ON jao.jobId = glj.id
      LEFT JOIN users AS ps2 ON glj.farmerId = ps2.id
      LEFT JOIN officerservices AS os ON glj.serviceId = os.id
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

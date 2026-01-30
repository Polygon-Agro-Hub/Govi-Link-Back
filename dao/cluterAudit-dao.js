const db = require('../startup/database');

exports.getclusterVisits = async (feildauditId) => {
  console.log("cluster ID:", feildauditId);

  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        fauc.id,
        fau.id AS feildauditId,
        f.regCode,
        f.id AS farmId,
        fau.jobId,
        fau.propose,
        fauc.isCompleted,
        'feildaudits' AS auditType,
        fc.clsName AS clusterName,
        ps.phoneNumber AS farmerMobile,
        ps.id AS farmerId,
        CONCAT(ps.firstName, ' ', ps.lastName) AS farmerName,
        NULL AS longitude, 
        NULL AS latitude,
        f.district,
        f.plotNo,
        f.street,
        f.city,
        cp.certificateId,
        cp.clusterId,
        cp.id AS certificationpaymentId,
        fcf.id AS farmclusterfarmersId,

        CASE 
          WHEN SUM(
            CASE 
              WHEN slqi.officerTickResult = 1 
                   OR (slqi.officerUploadImage IS NOT NULL AND slqi.officerUploadImage <> '') 
              THEN 1 
              ELSE 0 
            END
          ) > 0 THEN 'Opend'
          ELSE 'Start'
        END AS jobStatus,

        fau.sheduleDate

      FROM feildaudits AS fau
      LEFT JOIN feildauditcluster AS fauc ON fauc.feildAuditId = fau.id
      LEFT JOIN farms AS f ON f.id = fauc.farmId
      LEFT JOIN certificationpayment AS cp ON fau.paymentId = cp.id
      LEFT JOIN users AS ps ON f.userId = ps.id
      LEFT JOIN farmcluster AS fc ON cp.clusterId = fc.id
            LEFT JOIN farmclusterfarmers AS fcf ON fcf.farmId = f.id AND  fcf.clusterId = cp.clusterId
      LEFT JOIN slavequestionnaire AS sq ON fcf.id = sq.clusterFarmId
      LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id

      WHERE fauc.feildAuditId = ?
      GROUP BY fauc.id, fau.id, f.id, fcf.id, cp.id, ps.id, fc.id
    `;

    db.plantcare.query(sql, [feildauditId], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return reject(new Error("Database error"));
      }

      if (results.length === 0) {
        console.log("No data found for officer:", feildauditId);
        return reject(new Error("No pending visits found for today"));
      }

      console.log(results);
      resolve(results);
    });
  });
};



exports.UpdateStatus = async (feildauditId, jobId) => {
  console.log("Updating status to Ongoing for ID:", feildauditId, "JobID:", jobId);

  return new Promise((resolve, reject) => {
    // Determine which table to update based on jobId prefix
    let sql;
    let tableName;

    if (jobId && (jobId.startsWith('CA') || jobId.startsWith('FA'))) {
      // Update feildaudits table for CA (Cluster Audit) or FA (Field Audit)
      sql = `
        UPDATE feildaudits 
        SET status = 'Ongoing' 
        WHERE id = ?
      `;
      tableName = 'feildaudits';
    } else if (jobId && jobId.startsWith('SR')) {
      // Update govilinkjobs table for SR (Service Request)
      sql = `
        UPDATE govilinkjobs 
        SET status = 'Ongoing' 
        WHERE id = ?
      `;
      tableName = 'govilinkjobs';
    } else {
      return reject(new Error("Invalid jobId format"));
    }

    db.plantcare.query(sql, [feildauditId], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return reject(new Error("Database error"));
      }

      if (results.affectedRows === 0) {
        console.log(`No record found in ${tableName} with ID:`, feildauditId);
        return reject(new Error(`Record not found in ${tableName}`));
      }

      console.log(`Status updated successfully in ${tableName}:`, results);
      resolve({
        message: `Status updated to Ongoing successfully in ${tableName}`,
        affectedRows: results.affectedRows,
        table: tableName,
      });
    });
  });
};
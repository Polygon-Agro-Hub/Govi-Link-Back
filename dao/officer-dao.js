const db = require('../startup/database');

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
        AND (slqi.tickResult = 1 OR (slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> ''))
  )
)

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


// exports.getofficerVisitsDraft = async (officerId) => {
//   console.log("Officer ID for draft percentage:", officerId);

//   return new Promise((resolve, reject) => {

//     //need cluster id and if have, and farmid
//     const sql = `
//       SELECT 
//         fau.jobId,
//         fau.propose AS propose,
//         cp.userId AS farmerId,
//         cp.id AS certificationpaymentId,
//         CONCAT( gcu.firstName, ' ',  gcu.lastName) AS farmerName,
//         gcu.phoneNumber AS farmerMobile,
//         COUNT(slqi.id) AS totalTasks,

//         -- ✅ Count completed by tick
//         SUM(CASE WHEN slqi.tickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,

//         -- ✅ Count completed by photo
//         SUM(CASE WHEN slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,

//         -- ✅ Count unique completions (either tick OR photo)
//         SUM(
//           CASE 
//             WHEN slqi.tickResult = 1 OR (slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '') 
//             THEN 1 ELSE 0 
//           END
//         ) AS totalCompleted,

//         -- ✅ Calculate completion percentage
//         ROUND(
//           (SUM(
//             CASE 
//               WHEN slqi.tickResult = 1 OR (slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '') 
//               THEN 1 ELSE 0 
//             END
//           ) / COUNT(slqi.id)) * 100, 1
//         ) AS completionPercentage

//       FROM feildaudits AS fau
//       LEFT JOIN certificationpayment AS cp ON cp.id = fau.paymentId
//       LEFT JOIN slavequestionnaire AS sq ON sq.crtPaymentId = cp.id
//       LEFT JOIN slavequestionnaireitems AS slqi ON slqi.slaveId = sq.id
//        LEFT JOIN users AS gcu ON cp.userId = gcu.id
//       WHERE 
//         fau.assignOfficerId = ? 
//         AND fau.status = 'Pending'
//         AND DATE(fau.sheduleDate) = CURDATE()

//       GROUP BY fau.id, fau.jobId, cp.userId,  fau.status
//       HAVING completionPercentage < 100 OR (completionPercentage = 100 AND fau.status = 'Pending')
//       ORDER BY completionPercentage ASC;
//     `;

//     db.plantcare.query(sql, [officerId], (err, results) => {
//       if (err) {
//         console.error("❌ Database error (percentage draft):", err.message);
//         return reject(
//           new Error("Database error while fetching draft completion percentages")
//         );
//       }

//       if (!results.length) {
//         console.log("⚠️ No incomplete jobs found for officer:", officerId);
//         return resolve([]);
//       }

//       console.log("✅ Incomplete Draft Jobs Found:", results.length);
//       resolve(results);
//     });
//   });
// };

exports.getofficerVisitsDraft = async (officerId) => {
  console.log("Officer ID for draft percentage:", officerId);

  return new Promise((resolve, reject) => {
    const individualSql = `
      SELECT 
        fau.jobId,
        fau.propose AS propose,
        cp.userId AS farmerId,
        cp.id AS certificationpaymentId,
        CONCAT( gcu.firstName, ' ',  gcu.lastName) AS farmerName,
        gcu.phoneNumber AS farmerMobile,
        COUNT(slqi.id) AS totalTasks,
        SUM(CASE WHEN slqi.tickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,
        SUM(CASE WHEN slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,
        SUM(
          CASE WHEN slqi.tickResult = 1 OR (slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '') THEN 1 ELSE 0 END
        ) AS totalCompleted,
        ROUND(
          (SUM(
            CASE WHEN slqi.tickResult = 1 OR (slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '') THEN 1 ELSE 0 END
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
      HAVING completionPercentage < 100 OR (completionPercentage = 100 AND fau.status = 'Pending')
      ORDER BY completionPercentage ASC;
    `;

    const clusterSql = `
  SELECT 
    fau.jobId,
    fau.propose AS propose,
    cp.userId AS farmerId,
    cp.id AS certificationpaymentId,
    CONCAT(ps.firstName, ' ', ps.lastName) AS farmerName,
    ps.phoneNumber AS farmerMobile,
    cp.clusterId ,
    f.id AS farmId,
    COUNT(slqi.id) AS totalTasks,
    SUM(CASE WHEN slqi.tickResult = 1 THEN 1 ELSE 0 END) AS tickCompleted,
    SUM(CASE WHEN slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '' THEN 1 ELSE 0 END) AS photoCompleted,
    SUM(
      CASE WHEN slqi.tickResult = 1 OR (slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '') THEN 1 ELSE 0 END
    ) AS totalCompleted,
    ROUND(
      (SUM(
        CASE WHEN slqi.tickResult = 1 OR (slqi.uploadImage IS NOT NULL AND slqi.uploadImage <> '') THEN 1 ELSE 0 END
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
  GROUP BY fau.id, fau.jobId, cp.userId, fau.status, ps.firstName, ps.lastName, ps.phoneNumber, f.id
  HAVING completionPercentage < 100 OR (completionPercentage = 100 AND fau.status = 'Pending')
  ORDER BY completionPercentage ASC;
`;


    // Execute both queries
    db.plantcare.query(individualSql, [officerId], (err1, individualResults) => {
      if (err1) {
        console.error("❌ Database error (individual jobs):", err1.message);
        return reject(err1);
      }

      db.plantcare.query(clusterSql, [officerId], (err2, clusterResults) => {
        if (err2) {
          console.error("❌ Database error (cluster jobs):", err2.message);
          return reject(err2);
        }

        // Merge results
        const results = [...individualResults, ...clusterResults];
        console.log("✅ Draft Jobs Found:",results );
        resolve(results);
      });
    });
  });
};

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




// exports.getindividualauditsquestions = async (certificationpaymentId) => {
//   console.log("certification payment ID:", certificationpaymentId);

//   return new Promise((resolve, reject) => {
//     const sql = `
//       SELECT 
//         slqi.*,
//         c.logo,
//         c.srtName,
//         c.createdAt,
//         sq.id AS slavequestionnaireId,
//         c.id AS certificateId
//       FROM slavequestionnaireitems AS slqi
//       LEFT JOIN slavequestionnaire AS sq ON slqi.slaveId = sq.id
//       LEFT JOIN certificationpayment AS cp ON sq.crtPaymentId = cp.id
//       LEFT JOIN certificates AS c ON cp.certificateId = c.id
//       LEFT JOIN farmclusterfarmers AS fcf ON  sq.clusterFarmId = fcf.id 
//       WHERE sq.crtPaymentId = ?
//     `;

//     db.plantcare.query(sql, [certificationpaymentId], (err, results) => {
//       if (err) {
//         console.error("❌ Database error:", err.message);
//         return reject(new Error("Database error while fetching questions"));
//       }

//       if (results.length === 0) {
//         console.log("⚠️ No questions found for:", certificationpaymentId);
//         return reject(new Error("No questions found for this certification payment"));
//       }

//       // ✅ Extract one certificate info from the first row
//       const first = results[0];
//       const certificate = {
//         logo: first.logo || null,
//         srtName: first.srtName || "",
//         createdAt: first.createdAt || null,
//         slavequestionnaireId: first.slavequestionnaireId || null,
//          certificateId: first.certificateId || null
//       };

//       // ✅ Extract all questions (without duplicating certificate data)
//       const questions = results.map(({ logo, srtName, createdAt,slavequestionnaireId, certificateId, ...rest }) => rest);

//       console.log("✅ Questions count:", questions.length);
//       resolve({ certificate, questions });
//     });
//   });
// };

// exports.setCheckQuestions = async (id) => {
//   console.log("DAO: Updating tickResult for question ID:", id);

//   return new Promise((resolve, reject) => {
//     const sql = `
//       UPDATE slavequestionnaireitems
//       SET tickResult = 1
//       WHERE id = ?
//     `;

//     db.plantcare.query(sql, [id], (err, result) => {
//       if (err) {
//         console.error("❌ Database error:", err.message);
//         return reject(new Error("Database error while updating tickResult"));
//       }

//       if (result.affectedRows === 0) {
//         console.warn("⚠️ No question found with ID:", id);
//         return reject(new Error("Question not found"));
//       }

//       console.log("✅ tickResult updated successfully for question:", id);
//       resolve(result);
//     });
//   });
// };


exports.setCheckQuestions = async (id) => {
  console.log("DAO: Toggling tickResult for question ID:", id);

  return new Promise((resolve, reject) => {
    // Step 1: Get current tickResult
    const selectSql = `
      SELECT tickResult 
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

      const currentTick = results[0].tickResult || 0;
      const newTick = currentTick === 1 ? 0 : 1;

      // Step 2: Update with toggled value
      const updateSql = `
        UPDATE slavequestionnaireitems
        SET tickResult = ?
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
      SELECT uploadImage
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
      SET uploadImage = ?
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
      SET uploadImage = NULL
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

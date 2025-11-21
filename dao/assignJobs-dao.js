const db = require("../startup/database");

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
  console.log(
    "Officer ID:",
    officerId,
    "Date:",
    date,
    "isOverdue:",
    isOverdueSelected
  );

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
    const isOverdue =
      isOverdueSelected === true || isOverdueSelected === "true";

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

// Get assign officer list
exports.getassignofficerlistDAO = async (officerId, currentDate, jobId) => {
  return new Promise((resolve, reject) => {
    try {
      const formatDate = (d) => {
        const dt = new Date(d);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };

      const selectedDateString = formatDate(currentDate);

      // Step 1: Get the current officer's details
      const getOfficerSql = `
        SELECT 
          id,
          irmId,
          firstName,
          lastName,
          empId,
          status
        FROM feildofficer 
        WHERE id = ? 
        LIMIT 1
      `;

      db.plantcare.query(getOfficerSql, [officerId], (err, officerResults) => {
        if (err) {
          console.error("Database error in getIRMUsers:", err.message);
          return reject(new Error("Database error: " + err.message));
        }

        if (officerResults.length === 0) {
          return reject(
            new Error("No field officer found with the provided ID")
          );
        }

        const currentOfficer = officerResults[0];
        const irmId = currentOfficer.irmId;

        let targetIrmId;
        let includeCurrentOfficer = false;

        if (irmId === null || irmId === undefined) {
          targetIrmId = officerId;
          includeCurrentOfficer = false;
        } else {
          targetIrmId = irmId;
          includeCurrentOfficer = false;
        }

        console.log(`Target IRM ID: ${targetIrmId}`);

        // Step 2: Count assignments from both feildaudits and jobassignofficer tables
        const getUsersSql = `
          SELECT 
            fo.id,
            fo.firstName,
            fo.firstNameSinhala,
            fo.firstNameTamil,
            fo.lastName,
            fo.lastNameSinhala,
            fo.lastNameTamil,
            fo.empId,
            fo.irmId,
            fo.status,
            -- Count from feildaudits table (assignDate matches selected date and status is Pending)
            COUNT(DISTINCT 
              CASE WHEN DATE(fau.assignDate) = ? AND fau.status = 'Pending' THEN fau.id ELSE NULL END
            ) as feildauditsCount,
            -- Count from jobassignofficer table (govilinkjobs sheduleDate matches selected date)
            COUNT(DISTINCT 
              CASE WHEN DATE(gj.sheduleDate) = ? THEN jao.id ELSE NULL END
            ) as jobassignofficerCount,
            -- Total count (sum of both)
            (
              COUNT(DISTINCT 
                CASE WHEN DATE(fau.assignDate) = ? AND fau.status = 'Pending' THEN fau.id ELSE NULL END
              ) + 
              COUNT(DISTINCT 
                CASE WHEN DATE(gj.sheduleDate) = ? THEN jao.id ELSE NULL END
              )
            ) as totalAssignedCount
          FROM feildofficer AS fo
          -- Left join with feildaudits table for certification audit jobs
          LEFT JOIN feildaudits AS fau ON fo.id = fau.assignOfficerId 
            AND DATE(fau.assignDate) = ?
            AND fau.assignDate IS NOT NULL
            AND fau.status = 'Pending'
          -- Left join with jobassignofficer and govilinkjobs for service request jobs
          LEFT JOIN jobassignofficer AS jao ON fo.id = jao.officerId 
            AND jao.isActive = 1
          LEFT JOIN govilinkjobs AS gj ON jao.jobId = gj.id 
            AND DATE(gj.sheduleDate) = ?
          WHERE fo.irmId = ?
            AND fo.status = 'Approved'
          GROUP BY 
            fo.id, 
            fo.firstName, 
            fo.firstNameSinhala,
            fo.firstNameTamil,
            fo.lastName,
            fo.lastNameSinhala,
            fo.lastNameTamil,
            fo.empId, 
            fo.irmId,
            fo.status
          ORDER BY fo.firstName, fo.lastName
        `;

        const params = [
          selectedDateString,
          selectedDateString, 
          selectedDateString, 
          selectedDateString, 
          selectedDateString, 
          selectedDateString, 
          targetIrmId, 
        ];

        console.log("Counting assignments for date:", selectedDateString);
        console.log("SQL Parameters:", params);

        db.plantcare.query(getUsersSql, params, (err, userResults) => {
          if (err) {
            console.error("Database error fetching IRM users:", err.message);
            return reject(new Error("Database error: " + err.message));
          }

          // Format the response with detailed counts
          const formattedUsers = userResults.map((user) => {
            const feildauditsCount = parseInt(user.feildauditsCount) || 0;
            const jobassignofficerCount =
              parseInt(user.jobassignofficerCount) || 0;
            const totalAssignedCount = parseInt(user.totalAssignedCount) || 0;

            return {
              id: user.id,
              firstName: user.firstName,
              firstNameSinhala: user.firstNameSinhala,
              firstNameTamil: user.firstNameTamil,
              lastName: user.lastName,
              lastNameSinhala: user.lastNameSinhala,
              lastNameTamil: user.lastNameTamil,
              empId: user.empId,
              irmId: user.irmId,
              status: user.status,
              assigned: totalAssignedCount,
              feildauditsCount: feildauditsCount,
              jobassignofficerCount: jobassignofficerCount,
              totalAssignedCount: totalAssignedCount,
            };
          });

          // Debug: Log each officer's assignment breakdown with correct officer ID
          formattedUsers.forEach((user) => {
            console.log(
              `Officer ID: ${user.id} - ${user.firstName} ${user.lastName}:`
            );
            console.log(
              `  - Feildaudits assignments: ${user.feildauditsCount}`
            );
            console.log(
              `  - Jobassignofficer assignments: ${user.jobassignofficerCount}`
            );
            console.log(`  - Total assignments: ${user.totalAssignedCount}`);
          });

          resolve(formattedUsers);
        });
      });
    } catch (error) {
      console.error("Error in getIRMUsers:", error.message);
      reject(new Error("Error fetching IRM users: " + error.message));
    }
  });
};

// Assign field officer to field audits
exports.assignOfficerToFieldAuditsDAO = async (
  officerId,
  jobIds,
  date,
  assignedBy,
  propose,
  fieldAuditId
) => {
  return new Promise((resolve, reject) => {
    let connection;

    const currentTimestamp = new Date();
    const jobIdArray = Array.isArray(jobIds) ? jobIds : [jobIds];

    db.plantcare.getConnection((err, conn) => {
      if (err) {
        console.error("Database connection error:", err.message);
        return reject(new Error("Database connection error: " + err.message));
      }

      connection = conn;

      // Start transaction
      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          connection.release();
          return reject(
            new Error("Transaction error: " + transactionErr.message)
          );
        }

        // Step 1: Verify officer exists
        const verifyOfficerSql = `SELECT id, status FROM feildofficer WHERE id = ? AND status = 'Approved'`;

        connection.query(
          verifyOfficerSql,
          [officerId],
          (err, officerResults) => {
            if (err) {
              return rollback(
                connection,
                "Database error verifying officer: " + err.message
              );
            }

            if (officerResults.length === 0) {
              return rollback(connection, "Officer not found or not approved");
            }

            // Step 2: Determine which table to update based on propose
            if (propose === "Cluster" || propose === "Individual") {
              // Update feildaudits table
              updateFieldAudits(
                connection,
                officerId,
                jobIdArray,
                currentTimestamp
              );
            } else if (propose === "Requested" || !propose) {
              // Update jobassignofficer table
              updateJobAssignOfficer(
                connection,
                officerId,
                jobIdArray,
                currentTimestamp
              );
            } else {
              return rollback(connection, "Invalid propose value: " + propose);
            }
          }
        );
      });
    });

    // Function to update feildaudits table
    function updateFieldAudits(conn, assignOfficerId, jobIds, assignDate) {
      console.log(
        "Updating feildaudits for jobIds:",
        jobIds,
        "with propose:",
        propose
      );

      const updateFieldAuditsSql = `
        UPDATE feildaudits 
        SET 
          assignOfficerId = ?,
          assignDate = ?,
          assignBy = NULL
        WHERE jobId IN (?)
      `;

      conn.query(
        updateFieldAuditsSql,
        [assignOfficerId, assignDate, jobIds],
        (err, updateResults) => {
          if (err) {
            return rollback(
              conn,
              "Database error updating field audits: " + err.message
            );
          }

          // Get final results from feildaudits
          const getFinalResultsSql = `
            SELECT 
              id,
              jobId,
              assignOfficerId,
              status,
              propose,
              sheduleDate,
              assignDate,
              assignBy,
              paymentId
            FROM feildaudits 
            WHERE jobId IN (?)
          `;

          conn.query(getFinalResultsSql, [jobIds], (err, finalResults) => {
            if (err) {
              return rollback(
                conn,
                "Database error fetching final results: " + err.message
              );
            }

            commitTransaction(
              conn,
              finalResults,
              updateResults.affectedRows,
              "feildaudits"
            );
          });
        }
      );
    }

    // Function to update jobassignofficer table
    function updateJobAssignOfficer(conn, officerId, jobIds, currentTimestamp) {
      console.log("Updating jobassignofficer for jobIds:", jobIds);

      // First, get the govilinkjobs IDs for these jobIds (string values)
      const getGovilinkJobIdsSql = `
        SELECT id, jobId 
        FROM govilinkjobs 
        WHERE jobId IN (?)
      `;

      console.log("Searching for govilink jobs with jobIds:", jobIds);

      conn.query(getGovilinkJobIdsSql, [jobIds], (err, govilinkResults) => {
        if (err) {
          return rollback(
            conn,
            "Database error getting govilink job IDs: " + err.message
          );
        }

        console.log("Found govilink jobs:", govilinkResults);

        if (govilinkResults.length === 0) {
          return rollback(
            conn,
            "No govilink jobs found for the given job IDs: " + jobIds.join(", ")
          );
        }

        const govilinkJobIds = govilinkResults.map((job) => job.id);
        console.log("Found govilink job IDs:", govilinkJobIds);

        // Check which job IDs already exist in jobassignofficer table
        const checkExistingAssignmentsSql = `
          SELECT jobId, officerId, isActive 
          FROM jobassignofficer 
          WHERE jobId IN (?) AND isActive = 1
        `;

        conn.query(
          checkExistingAssignmentsSql,
          [govilinkJobIds],
          (err, existingAssignments) => {
            if (err) {
              return rollback(
                conn,
                "Database error checking existing assignments: " + err.message
              );
            }

            console.log("Existing assignments found:", existingAssignments);

            const existingJobIds = existingAssignments.map(
              (assignment) => assignment.jobId
            );
            const newJobIds = govilinkJobIds.filter(
              (jobId) => !existingJobIds.includes(jobId)
            );

            let totalAffectedRows = 0;
            const allPromises = [];

            // Update existing assignments
            if (existingJobIds.length > 0) {
              const updateExistingSql = `
              UPDATE jobassignofficer 
              SET 
                officerId = ?,
                createdAt = ?,
                isActive = 1
              WHERE jobId IN (?)
            `;

              const updatePromise = new Promise((resolve, reject) => {
                conn.query(
                  updateExistingSql,
                  [officerId, currentTimestamp, existingJobIds],
                  (err, updateResults) => {
                    if (err) {
                      reject(
                        new Error(
                          "Database error updating existing assignments: " +
                            err.message
                        )
                      );
                    } else {
                      console.log(
                        `Updated ${updateResults.affectedRows} existing assignments`
                      );
                      totalAffectedRows += updateResults.affectedRows;
                      resolve(updateResults);
                    }
                  }
                );
              });
              allPromises.push(updatePromise);
            }

            // Insert new assignments
            if (newJobIds.length > 0) {
              const insertValues = newJobIds.map((jobId) => [
                jobId,
                officerId,
                1,
                currentTimestamp,
              ]);

              const insertJobAssignSql = `
              INSERT INTO jobassignofficer (jobId, officerId, isActive, createdAt) 
              VALUES ?
            `;

              const insertPromise = new Promise((resolve, reject) => {
                conn.query(
                  insertJobAssignSql,
                  [insertValues],
                  (err, insertResults) => {
                    if (err) {
                      reject(
                        new Error(
                          "Database error inserting new assignments: " +
                            err.message
                        )
                      );
                    } else {
                      console.log(
                        `Inserted ${insertResults.affectedRows} new job assignments`
                      );
                      totalAffectedRows += insertResults.affectedRows;
                      resolve(insertResults);
                    }
                  }
                );
              });
              allPromises.push(insertPromise);
            }

            // Wait for all operations to complete
            Promise.all(allPromises)
              .then(() => {
                // Get final results from jobassignofficer
                const getFinalResultsSql = `
                SELECT 
                  jao.id,
                  jao.jobId,
                  jao.officerId,
                  jao.isActive,
                  jao.createdAt,
                  gj.jobId as govilinkJobId
                FROM jobassignofficer jao
                LEFT JOIN govilinkjobs gj ON jao.jobId = gj.id
                WHERE jao.officerId = ? 
                  AND jao.jobId IN (?)
                  AND jao.isActive = 1
              `;

                conn.query(
                  getFinalResultsSql,
                  [officerId, govilinkJobIds],
                  (err, finalResults) => {
                    if (err) {
                      return rollback(
                        conn,
                        "Database error fetching final results: " + err.message
                      );
                    }

                    commitTransaction(
                      conn,
                      finalResults,
                      totalAffectedRows,
                      "jobassignofficer"
                    );
                  }
                );
              })
              .catch((error) => {
                return rollback(conn, error.message);
              });
          }
        );
      });
    }

    // Function to commit transaction
    function commitTransaction(conn, finalResults, affectedRows, tableName) {
      conn.commit((commitErr) => {
        if (commitErr) {
          return rollback(
            conn,
            "Transaction commit error: " + commitErr.message
          );
        }

        console.log(
          `Successfully processed ${finalResults.length} records in ${tableName}`
        );

        conn.release();

        resolve({
          success: true,
          message: `Successfully assigned officer to ${affectedRows} jobs in ${tableName}`,
          totalProcessed: finalResults.length,
          affectedRows: affectedRows,
          updatedRecords: finalResults,
          tableUpdated: tableName,
        });
      });
    }

    // Rollback helper function
    function rollback(conn, errorMessage) {
      conn.rollback(() => {
        conn.release();
        console.error("Transaction rolled back:", errorMessage);
        reject(new Error(errorMessage));
      });
    }
  });
};

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
      : `DATE(fau.sheduleDate) = ? AND fau.status = 'Pending'
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
      : "DATE(glj.sheduleDate) = ? AND glj.status = 'Pending' AND jao.isActive = 1";
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
            COUNT(DISTINCT 
              CASE WHEN DATE(fau.sheduleDate) = ? AND (fau.status = 'Pending' OR fau.status = 'Completed') THEN fau.id ELSE NULL END
            ) as feildauditsCount,

            COUNT(DISTINCT 
              CASE WHEN DATE(gj.sheduleDate) = ? AND (gj.status = 'Pending' OR gj.status = 'Completed') THEN jao.id ELSE NULL END
            ) as jobassignofficerCount,

            (
              COUNT(DISTINCT 
                CASE WHEN DATE(fau.sheduleDate) = ? AND (fau.status = 'Pending' OR fau.status = 'Completed') THEN fau.id ELSE NULL END
              ) + 
              COUNT(DISTINCT 
                CASE WHEN DATE(gj.sheduleDate) = ? AND (gj.status = 'Pending' OR gj.status = 'Completed') THEN jao.id ELSE NULL END
              )
            ) as totalAssignedCount
          FROM feildofficer AS fo

          LEFT JOIN feildaudits AS fau ON fo.id = fau.assignOfficerId 
            AND DATE(fau.sheduleDate) = ?
            AND fau.sheduleDate IS NOT NULL

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
  date,
  assignedBy,
  propose,
  fieldAuditIds = [],
  govilinkJobIds = [],
  auditType
) => {
  return new Promise((resolve, reject) => {
    let connection;

    const currentTimestamp = new Date();
    const formattedDate = new Date(date);

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

            // Step 2: Determine which update function to call based on auditType
            if (auditType === "feildaudits") {
              // Update feildaudits table using fieldAuditIds
              updateFieldAudits(
                connection,
                officerId,
                fieldAuditIds,
                formattedDate,
                propose,
                assignedBy
              );
            } else if (auditType === "govilinkjobs") {
              // Update jobassignofficer table using govilinkJobIds
              updateGovilinkJobs(
                connection,
                officerId,
                govilinkJobIds,
                currentTimestamp,
                formattedDate,
                propose,
                assignedBy
              );
            } else {
              return rollback(connection, "Invalid auditType: " + auditType);
            }
          }
        );
      });
    });

    // Function to update feildaudits table (for feildaudits type)
    function updateFieldAudits(
      conn,
      assignOfficerId,
      fieldAuditIds,
      scheduleDate,
      proposeType,
      assignedBy
    ) {
      // First, check if these field audits exist
      const checkFieldAuditsSql = `
        SELECT id, jobId, assignOfficerId, status 
        FROM feildaudits 
        WHERE id IN (?)
      `;

      conn.query(checkFieldAuditsSql, [fieldAuditIds], (err, auditResults) => {
        if (err) {
          return rollback(
            conn,
            "Database error checking field audits: " + err.message
          );
        }

        if (auditResults.length === 0) {
          return rollback(conn, "No field audits found with the given IDs");
        }

        // Check if any audits are already assigned to other officers
        const alreadyAssignedToOthers = auditResults.filter(
          (audit) =>
            audit.assignOfficerId && audit.assignOfficerId !== assignOfficerId
        );

        if (alreadyAssignedToOthers.length > 0) {
          console.log(
            `Reassigning ${alreadyAssignedToOthers.length} field audits from other officers to officer ${assignOfficerId}:`
          );
          console.log(
            alreadyAssignedToOthers
              .map(
                (a) =>
                  `ID: ${a.id}, Job: ${a.jobId}, Previously assigned to: ${a.assignOfficerId}`
              )
              .join(", ")
          );
        }

        const updateFieldAuditsSql = `
          UPDATE feildaudits 
          SET 
            assignOfficerId = ?,
            sheduleDate = ?,
            assignByCFO = ?,
            assignDate = NOW()
          WHERE id IN (?)
        `;

        console.log("Updating field audits with params:", {
          assignOfficerId,
          scheduleDate,
          fieldAuditIds,
        });

        conn.query(
          updateFieldAuditsSql,
          [assignOfficerId, scheduleDate, assignedBy, fieldAuditIds],
          (err, updateResults) => {
            if (err) {
              return rollback(
                conn,
                "Database error updating field audits: " + err.message
              );
            }

            // Include reassignment info in the audit results if needed
            const updatedAuditResults = auditResults.map((audit) => ({
              ...audit,
              previousAssignOfficerId: audit.assignOfficerId,
              newAssignOfficerId: assignOfficerId,
            }));

            // Directly commit without fetching final results
            commitTransaction(
              conn,
              updatedAuditResults,
              updateResults.affectedRows,
              "feildaudits",
              proposeType
            );
          }
        );
      });
    }

    // Function to update govilinkjobs (for govilinkjobs type)
    function updateGovilinkJobs(
      conn,
      officerId,
      govilinkJobIds,
      currentTimestamp,
      scheduleDate,
      proposeType
    ) {
      // First, check if these govilink jobs exist
      const checkGovilinkJobsSql = `
        SELECT gj.id
        FROM govilinkjobs gj
        WHERE gj.id IN (?)
      `;

      conn.query(checkGovilinkJobsSql, [govilinkJobIds], (err, jobResults) => {
        if (err) {
          return rollback(
            conn,
            "Database error checking govilink jobs: " + err.message
          );
        }

        if (jobResults.length === 0) {
          return rollback(conn, "No govilink jobs found with the given IDs");
        }

        // Step 1: Update or insert into jobassignofficer table
        updateJobAssignOfficerTable(
          conn,
          officerId,
          govilinkJobIds,
          currentTimestamp,
          jobResults,
          scheduleDate,
          proposeType,
          assignedBy
        );
      });
    }

    // Function to update jobassignofficer table
    function updateJobAssignOfficerTable(
      conn,
      officerId,
      govilinkJobIds,
      currentTimestamp,
      jobResults,
      scheduleDate,
      proposeType
    ) {
      // Check which job IDs already exist in jobassignofficer table with isActive = 1
      const checkExistingAssignmentsSql = `
        SELECT jobId, officerId
        FROM jobassignofficer 
        WHERE jobId IN (?) AND isActive = 1
      `;

      console.log("Checking existing assignments for job IDs:", govilinkJobIds);

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

          console.log(
            "Existing active assignments found:",
            existingAssignments
          );

          const existingJobIds = existingAssignments.map(
            (assignment) => assignment.jobId
          );

          const newJobIds = govilinkJobIds.filter(
            (jobId) => !existingJobIds.includes(jobId)
          );

          console.log({
            existingJobIds,
            newJobIds,
            govilinkJobIds,
          });

          let totalAffectedRows = 0;
          const allPromises = [];

          // Step 1: Deactivate existing active assignments (set isActive = 0)
          if (existingJobIds.length > 0) {
            const deactivateExistingSql = `
              UPDATE jobassignofficer 
              SET 
                isActive = 0
              WHERE jobId IN (?) AND isActive = 1
            `;

            console.log("Deactivating job IDs:", existingJobIds);

            const deactivatePromise = new Promise((resolve, reject) => {
              conn.query(
                deactivateExistingSql,
                [existingJobIds],
                (err, deactivateResults) => {
                  if (err) {
                    reject(
                      new Error(
                        "Database error deactivating existing assignments: " +
                          err.message
                      )
                    );
                  } else {
                    console.log(
                      `Deactivated ${deactivateResults.affectedRows} existing assignments in jobassignofficer`
                    );
                    totalAffectedRows += deactivateResults.affectedRows;
                    resolve(deactivateResults);
                  }
                }
              );
            });
            allPromises.push(deactivatePromise);

            // Step 2: Insert new active assignments for previously assigned jobs
            const insertReassignedValues = existingJobIds.map((jobId) => [
              jobId,
              officerId,
              1,
              currentTimestamp,
            ]);

            console.log("Inserting reassigned values:", insertReassignedValues);

            const insertReassignedSql = `
              INSERT INTO jobassignofficer (jobId, officerId, isActive, createdAt)
              VALUES ?
            `;

            const insertReassignedPromise = new Promise((resolve, reject) => {
              conn.query(
                insertReassignedSql,
                [insertReassignedValues],
                (err, insertResults) => {
                  if (err) {
                    reject(
                      new Error(
                        "Database error inserting reassigned assignments: " +
                          err.message
                      )
                    );
                  } else {
                    console.log(
                      `Inserted ${insertResults.affectedRows} reassigned assignments in jobassignofficer`
                    );
                    totalAffectedRows += insertResults.affectedRows;
                    resolve(insertResults);
                  }
                }
              );
            });
            allPromises.push(insertReassignedPromise);
          }
          // Step 3: Update govilinkjobs table schedule date and status
          const updateGovilinkJobsSql = `
            UPDATE govilinkjobs 
            SET 
              sheduleDate = ?,
              assignByCFO = ?,
              assignDate = NOW()
            WHERE id IN (?)
          `;

          console.log("Updating govilink jobs with:", {
            scheduleDate,
            assignedBy,
            govilinkJobIds
          });

          const updateGovilinkPromise = new Promise((resolve, reject) => {
            conn.query(
              updateGovilinkJobsSql,
              [scheduleDate,assignedBy, govilinkJobIds],
              (err, updateResults) => {
                if (err) {
                  reject(
                    new Error(
                      "Database error updating govilink jobs: " + err.message
                    )
                  );
                } else {
                  console.log(
                    `Updated ${updateResults.affectedRows} govilink jobs`
                  );
                  totalAffectedRows += updateResults.affectedRows;
                  resolve(updateResults);
                }
              }
            );
          });
          allPromises.push(updateGovilinkPromise);

          // Wait for all operations to complete
          Promise.all(allPromises)
            .then(() => {
              console.log("All operations completed successfully");
              // Directly commit without fetching final results
              commitTransaction(
                conn,
                jobResults,
                totalAffectedRows,
                "jobassignofficer and govilinkjobs",
                proposeType
              );
            })
            .catch((error) => {
              console.error("Error in Promise.all:", error);
              return rollback(conn, error.message);
            });
        }
      );
    }

    // Function to commit transaction
    function commitTransaction(
      conn,
      results,
      affectedRows,
      tableName,
      proposeType
    ) {
      conn.commit((commitErr) => {
        if (commitErr) {
          return rollback(
            conn,
            "Transaction commit error: " + commitErr.message
          );
        }

        console.log(
          `Successfully processed ${results.length} records in ${tableName}`
        );

        conn.release();

        resolve({
          success: true,
          message: `Successfully assigned officer to ${affectedRows} ${proposeType} jobs`,
          totalProcessed: results.length,
          affectedRows: affectedRows,
          updatedRecords: results,
          tablesUpdated: tableName,
          proposeType: proposeType,
          auditType: auditType,
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

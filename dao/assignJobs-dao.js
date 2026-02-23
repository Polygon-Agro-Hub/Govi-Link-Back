const db = require("../startup/database");

exports.getVisitsbydate = async (officerId, date, isOverdueSelected) => {
  return new Promise((resolve, reject) => {
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

    let params;

    if (isOverdue) {
      params = [officerId, officerId];
    } else {
      params = [officerId, selectedDateString, officerId, selectedDateString];
    }

    db.plantcare.query(sql, params, (err, results) => {
      if (err) return reject(new Error("Database error: " + err.message));
      resolve(results);
    });
  });
};

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

        db.plantcare.query(getUsersSql, params, (err, userResults) => {
          if (err) {
            console.error("Database error fetching IRM users:", err.message);
            return reject(new Error("Database error: " + err.message));
          }

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

          resolve(formattedUsers);
        });
      });
    } catch (error) {
      console.error("Error in getIRMUsers:", error.message);
      reject(new Error("Error fetching IRM users: " + error.message));
    }
  });
};

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
      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          connection.release();
          return reject(
            new Error("Transaction error: " + transactionErr.message)
          );
        }
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
            if (auditType === "feildaudits") {
              updateFieldAudits(
                connection,
                officerId,
                fieldAuditIds,
                formattedDate,
                propose,
                assignedBy
              );
            } else if (auditType === "govilinkjobs") {
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

    function updateFieldAudits(
      conn,
      assignOfficerId,
      fieldAuditIds,
      scheduleDate,
      proposeType,
      assignedBy
    ) {
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

            const updatedAuditResults = auditResults.map((audit) => ({
              ...audit,
              previousAssignOfficerId: audit.assignOfficerId,
              newAssignOfficerId: assignOfficerId,
            }));

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
    function updateGovilinkJobs(
      conn,
      officerId,
      govilinkJobIds,
      currentTimestamp,
      scheduleDate,
      proposeType
    ) {
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

    function updateJobAssignOfficerTable(
      conn,
      officerId,
      govilinkJobIds,
      currentTimestamp,
      jobResults,
      scheduleDate,
      proposeType
    ) {
      const checkExistingAssignmentsSql = `
        SELECT jobId, officerId
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

          const existingJobIds = existingAssignments.map(
            (assignment) => assignment.jobId
          );

          const newJobIds = govilinkJobIds.filter(
            (jobId) => !existingJobIds.includes(jobId)
          );

          let totalAffectedRows = 0;
          const allPromises = [];
          if (existingJobIds.length > 0) {
            const deactivateExistingSql = `
              UPDATE jobassignofficer 
              SET 
                isActive = 0
              WHERE jobId IN (?) AND isActive = 1
            `;

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
                    totalAffectedRows += deactivateResults.affectedRows;
                    resolve(deactivateResults);
                  }
                }
              );
            });
            allPromises.push(deactivatePromise);

            const insertReassignedValues = existingJobIds.map((jobId) => [
              jobId,
              officerId,
              1,
              currentTimestamp,
            ]);

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
                    totalAffectedRows += insertResults.affectedRows;
                    resolve(insertResults);
                  }
                }
              );
            });
            allPromises.push(insertReassignedPromise);
          }
          const updateGovilinkJobsSql = `
            UPDATE govilinkjobs 
            SET 
              sheduleDate = ?,
              assignByCFO = ?,
              assignDate = NOW()
            WHERE id IN (?)
          `;

          const updateGovilinkPromise = new Promise((resolve, reject) => {
            conn.query(
              updateGovilinkJobsSql,
              [scheduleDate, assignedBy, govilinkJobIds],
              (err, updateResults) => {
                if (err) {
                  reject(
                    new Error(
                      "Database error updating govilink jobs: " + err.message
                    )
                  );
                } else {
                  totalAffectedRows += updateResults.affectedRows;
                  resolve(updateResults);
                }
              }
            );
          });
          allPromises.push(updateGovilinkPromise);

          Promise.all(allPromises)
            .then(() => {
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

    function rollback(conn, errorMessage) {
      conn.rollback(() => {
        conn.release();
        console.error("Transaction rolled back:", errorMessage);
        reject(new Error(errorMessage));
      });
    }
  });
};

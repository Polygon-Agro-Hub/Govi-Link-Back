const db = require("../startup/database");

exports.getCapitalRequest = async (officerId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT 
          ir.id,
          ir.jobId,
          ir.farmerId,
          ir.auditedDate,
          CONCAT(u.firstname, ' ', u.lastname) AS farmerName
        FROM investmentrequest ir
        LEFT JOIN plant_care.users u
          ON u.id = ir.farmerId
        WHERE ir.officerId = ?
          AND ir.auditedDate IS NULL
    `;
    db.investments.query(sql, [officerId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getCapitalRequestById = async (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        ir.id,
        ir.jobId,
        ir.farmerId,
        ir.extentha,
        ir.extentp,
        ir.extentac,
        ir.investment,
        ir.expectedYield,
        ir.nicFront,
        ir.nicBack,
        ir.lndPlot,
        ir.lndStreet,
        ir.lndCity,
        DATE_FORMAT(ir.startDate, '%Y-%m-%d') AS startDate,
        CONCAT(u.firstname, ' ', u.lastname) AS farmerName,
        u.phoneNumber,
        u.district,
        cg.cropNameEnglish,
        cg.cropNameSinhala,
        cg.cropNameTamil
      FROM investmentrequest ir
      LEFT JOIN plant_care.users u ON u.id = ir.farmerId
      LEFT JOIN plant_care.cropgroup cg ON cg.id = ir.cropId
      WHERE ir.id = ?
    `;
    db.investments.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};


const VALID_TABLES = [
  'inspectionpersonal',
  'inspectionlabour',
  'inspectionland',
  'inspectionharveststorage',
  'inspectioncropping',
  'inspectionprofit',
  'inspectionidproof',
  'inspectioneconomical',
  'inspectioncultivation',
  'inspectioninvestment',
  'inspectionfinance'
];

const TABLE_FOREIGN_KEY = 'reqId';
const FILE_UPLOAD_TABLES = {
  'inspectionidproof': {
    fields: ['frontImg', 'backImg'],
    folder: 'inspection/idproof'
  },
  'inspectionland': {
    fields: ['images'],
    folder: 'inspection/land',
    isArray: true
  },
  'inspectioncultivation': {
    fields: ['waterImage'],
    folder: 'inspection/water',
    isArray: true
  }
};

const isValidTable = (tableName) => {
  return VALID_TABLES.includes(tableName);
};

exports.insertInspectionData = async (tableName, data) => {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  return new Promise((resolve, reject) => {
    const processedData = { ...data };
    if (tableName === 'inspectionfinance') {
      const jsonFields = ['assetsLand', 'assetsBuilding', 'assetsVehicle', 'assetsMachinery'];
      jsonFields.forEach(field => {
        if (processedData[field]) {
          if (typeof processedData[field] === 'string') {
            try {
              const parsed = JSON.parse(processedData[field]);
              processedData[field] = JSON.stringify(parsed);
            } catch (e) {
              console.error(`Invalid JSON for ${field}:`, processedData[field]);
              processedData[field] = null;
            }
          } else {
            processedData[field] = JSON.stringify(processedData[field]);
          }
        }
      });
    }

    const columns = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.map(col => `\`${col}\``).join(', ');

    const query = `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${placeholders})`;

    db.investments.query(query, values, (error, results) => {
      if (error) {
        console.error(`Error inserting into ${tableName}:`, error);
        reject(error);
      } else {
        resolve({
          success: true,
          insertId: results.insertId,
          tableName,
          affectedRows: results.affectedRows
        });
      }
    });
  });
};

exports.updateInspectionData = async (tableName, reqId, data) => {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  return new Promise((resolve, reject) => {
    const updateData = { ...data };
    delete updateData.reqId;
    delete updateData.id;
    delete updateData.createdAt;

    if (tableName === 'inspectionfinance') {
      const jsonFields = ['assetsLand', 'assetsBuilding', 'assetsVehicle', 'assetsMachinery'];
      jsonFields.forEach(field => {
        if (updateData[field]) {
          if (typeof updateData[field] === 'string') {
            try {
              const parsed = JSON.parse(updateData[field]);
              updateData[field] = JSON.stringify(parsed);
            } catch (e) {
              console.error(`Invalid JSON for ${field}:`, updateData[field]);
              updateData[field] = null;
            }
          } else {
            updateData[field] = JSON.stringify(updateData[field]);
          }
        }
      });
    }

    const columns = Object.keys(updateData);
    const values = Object.values(updateData);

    if (columns.length === 0) {
      return reject(new Error('No data to update'));
    }

    const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
    values.push(reqId);

    const query = `UPDATE \`${tableName}\` SET ${setClause} WHERE ${TABLE_FOREIGN_KEY} = ?`;

    db.investments.query(query, values, (error, results) => {
      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        reject(error);
      } else {
        resolve({
          success: true,
          affectedRows: results.affectedRows,
          tableName,
          changedRows: results.changedRows
        });
      }
    });
  });
};

exports.checkRecordExists = async (tableName, reqId) => {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(*) AS count FROM \`${tableName}\` WHERE ${TABLE_FOREIGN_KEY} = ?`;

    db.investments.query(query, [reqId], (error, results) => {
      if (error) {
        console.error(`Error checking record in ${tableName}:`, error);
        reject(error);
      } else {
        resolve(results[0].count > 0);
      }
    });
  });
};

exports.getInspectionData = async (tableName, reqId) => {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM \`${tableName}\` WHERE ${TABLE_FOREIGN_KEY} = ?`;

    db.investments.query(query, [reqId], (error, results) => {
      if (error) {
        console.error(`Error fetching from ${tableName}:`, error);
        reject(error);
      } else {
        const data = results[0] || null;
        resolve(data);
      }
    });
  });
};

exports.deleteAllInspectionData = async (reqId) => {
  return new Promise((resolve, reject) => {
    db.investments.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Error getting connection:', err);
        return reject(err);
      }

      connection.beginTransaction((transErr) => {
        if (transErr) {
          console.error('❌ Error starting transaction:', transErr);
          connection.release();
          return reject(transErr);
        }

        let deletedTables = [];
        let totalDeleted = 0;

        const deleteFromTable = (tableName) => {
          return new Promise((resolveDelete, rejectDelete) => {
            const query = `DELETE FROM \`${tableName}\` WHERE ${TABLE_FOREIGN_KEY} = ?`;

            connection.query(query, [reqId], (error, results) => {
              if (error) {
                console.error(`❌ Error deleting from ${tableName}:`, error);
                rejectDelete(error);
              } else {
                if (results.affectedRows > 0) {
                  deletedTables.push(tableName);
                  totalDeleted += results.affectedRows;
                } else {
                  console.log(`ℹ️ No rows found in ${tableName} for reqId: ${reqId}`);
                }
                resolveDelete();
              }
            });
          });
        };

        const deleteSequentially = async () => {
          try {
            for (const tableName of VALID_TABLES) {
              await deleteFromTable(tableName);
            }

            connection.commit((commitErr) => {
              if (commitErr) {
                console.error('❌ Error committing transaction:', commitErr);
                return connection.rollback(() => {
                  connection.release();
                  reject(commitErr);
                });
              }

              connection.release();

              resolve({
                success: true,
                deletedTables,
                totalDeleted
              });
            });
          } catch (deleteError) {
            console.error('❌ Error during deletion:', deleteError);
            connection.rollback(() => {
              connection.release();
              reject({
                success: false,
                error: deleteError.message
              });
            });
          }
        };

        deleteSequentially();
      });
    });
  });
};

exports.checkAllTablesHaveData = async (reqId) => {
  return new Promise((resolve, reject) => {
    const checkPromises = VALID_TABLES.map(tableName => {
      return new Promise((resolveCheck, rejectCheck) => {
        const query = `SELECT COUNT(*) AS count FROM \`${tableName}\` WHERE ${TABLE_FOREIGN_KEY} = ?`;

        db.investments.query(query, [reqId], (error, results) => {
          if (error) {
            console.error(`❌ Error checking ${tableName}:`, error);
            rejectCheck(error);
          } else {
            const hasData = results[0].count > 0;
            resolveCheck({
              tableName,
              hasData,
              count: results[0].count
            });
          }
        });
      });
    });

    Promise.all(checkPromises)
      .then(results => {
        const missingTables = results.filter(r => !r.hasData).map(r => r.tableName);
        const completedTables = results.filter(r => r.hasData).map(r => r.tableName);
        const allTablesHaveData = missingTables.length === 0;

        if (missingTables.length > 0) {
          console.log(`❌ Missing tables (${missingTables.length}):`, missingTables);
        }

        resolve({
          allTablesHaveData,
          totalTables: VALID_TABLES.length,
          completedCount: completedTables.length,
          missingCount: missingTables.length,
          completedTables,
          missingTables,
          details: results
        });
      })
      .catch(error => {
        console.error('❌ Error checking tables:', error);
        reject(error);
      });
  });
};

exports.updateAuditedDate = async (reqId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataCheck = await exports.checkAllTablesHaveData(reqId);

      if (!dataCheck.allTablesHaveData) {
        return reject({
          success: false,
          error: 'Incomplete inspection data',
          message: `Missing data in ${dataCheck.missingCount} table(s): ${dataCheck.missingTables.join(', ')}`,
          completedCount: dataCheck.completedCount,
          totalTables: dataCheck.totalTables,
          missingTables: dataCheck.missingTables
        });
      }

      const query = `
        UPDATE investmentrequest 
        SET auditedDate = NOW() 
        WHERE id = ?
      `;

      db.investments.query(query, [reqId], (error, results) => {
        if (error) {
          console.error('❌ Error updating auditedDate:', error);
          return reject(error);
        }
        if (results.affectedRows === 0) {
          return reject(new Error('No request found with the given ID'));
        }
        resolve({
          success: true,
          reqId: reqId,
          affectedRows: results.affectedRows,
          completedTables: dataCheck.completedTables,
          totalTables: dataCheck.totalTables
        });
      });
    } catch (error) {
      console.error('❌ Error in updateAuditedDate:', error);
      reject(error);
    }
  });
};

exports.isValidTable = isValidTable;
exports.VALID_TABLES = VALID_TABLES;
exports.FILE_UPLOAD_TABLES = FILE_UPLOAD_TABLES;
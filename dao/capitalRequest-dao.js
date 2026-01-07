const db = require("../startup/database");


exports.getCapitalRequest = async (officerId) => {
  return new Promise((resolve, reject) => {
    const sql = `
SELECT 
  ir.id,
  ir.jobId,
  ir.farmerId,
   CONCAT(u.firstname, ' ', u.lastname) AS farmerName
FROM investmentrequest ir
LEFT JOIN plant_care.users u
  ON u.id = ir.farmerId
WHERE ir.officerId = ?

    `;

    db.investments.query(sql, [officerId], (err, results) => {
      if (err) return reject(err);

      console.log("✅ Fetched requests", officerId, ":", results);
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

      console.log("✅ Fetched request", id, ":", results);
      resolve(results);
    });
  });
};


const VALID_TABLES = [
  'inspectionpersonal',
  'inspectionlabour',
  'inspectionland',
  'inspectioncrop',
  'inspectionwater',
  'inspectionsoil',
  'inspectionidproof',
  'inspectionpest',
  'inspectionharvest',
  'inspectionmarketing',
  'inspectionfinance'
];

const TABLE_FOREIGN_KEY = 'reqId';

// Tables that support file uploads
const FILE_UPLOAD_TABLES = {
  'inspectionidproof': {
    fields: ['frontImg', 'backImg'],
    folder: 'inspection/idproof'
  },
  'inspectionland': {
    fields: ['images'],
    folder: 'inspection/land',
    isArray: true  // ✅ This is critical!
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
    // ✅ Process JSON fields before inserting
    const processedData = { ...data };
    
    // Handle JSON columns for inspectionfinance
    if (tableName === 'inspectionfinance') {
      const jsonFields = ['assetsLand', 'assetsBuilding', 'assetsVehicle', 'assetsMachinery'];
      jsonFields.forEach(field => {
        if (processedData[field]) {
          // If it's already a string, parse and re-stringify to ensure valid JSON
          if (typeof processedData[field] === 'string') {
            try {
              const parsed = JSON.parse(processedData[field]);
              processedData[field] = JSON.stringify(parsed);
            } catch (e) {
              console.error(`Invalid JSON for ${field}:`, processedData[field]);
              processedData[field] = null;
            }
          } else {
            // If it's an object/array, stringify it
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
    // Remove fields that shouldn't be updated
    const updateData = { ...data };
    delete updateData.reqId;
    delete updateData.id;
    delete updateData.createdAt;

    // ✅ Process JSON fields before updating
    if (tableName === 'inspectionfinance') {
      const jsonFields = ['assetsLand', 'assetsBuilding', 'assetsVehicle', 'assetsMachinery'];
      jsonFields.forEach(field => {
        if (updateData[field]) {
          // If it's already a string, parse and re-stringify to ensure valid JSON
          if (typeof updateData[field] === 'string') {
            try {
              const parsed = JSON.parse(updateData[field]);
              updateData[field] = JSON.stringify(parsed);
            } catch (e) {
              console.error(`Invalid JSON for ${field}:`, updateData[field]);
              updateData[field] = null;
            }
          } else {
            // If it's an object/array, stringify it
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
        
        if (data && tableName === 'inspectionfinance') {
          console.log('🔍 Asset types:', {
            assetsLand: typeof data.assetsLand,
            assetsBuilding: typeof data.assetsBuilding,
            assetsVehicle: typeof data.assetsVehicle,
            assetsMachinery: typeof data.assetsMachinery
          });
          
          console.log('📊 Asset values:', {
            assetsLand: data.assetsLand,
            assetsBuilding: data.assetsBuilding,
            assetsVehicle: data.assetsVehicle,
            assetsMachinery: data.assetsMachinery
          });
        }
        
        resolve(data);
      }
    });
  });
};

exports.isValidTable = isValidTable;
exports.VALID_TABLES = VALID_TABLES;
exports.FILE_UPLOAD_TABLES = FILE_UPLOAD_TABLES;
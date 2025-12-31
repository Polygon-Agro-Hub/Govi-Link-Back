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

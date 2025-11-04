const db = require('../startup/database');
const bcrypt = require('bcrypt');

exports.loginUser = async (empId, password) => {
  try {
    const sql = `
      SELECT empId, password, id, JobRole AS role,status, passwordUpdated AS passwordUpdate
      FROM feildofficer
      WHERE empId = ? AND status = "Approved"
    `;
    const [results] = await db.plantcare.promise().query(sql, [empId]);

    if (results.length === 0) {
      throw new Error('User not found');
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    return {
      success: true,
      empId: user.empId,
      id: user.id,
      role: user.role,
      passwordUpdate: user.passwordUpdate,
      status: user.status
    };
  } catch (err) {
    throw new Error('Database error:' + err.message);
  }
};

exports.getprofile = async (officerId) =>{
  console.log("userID", officerId)
return new Promise((resolve, reject) => {
  let sql = `
  SELECT empId, JobRole AS role,status, firstName, firstNameSinhala,firstNameTamil, lastName, lastNameSinhala, lastNameTamil, profile as profileImg
  FROM feildofficer
  WHERE id = ?
  `

db.plantcare.query(sql, [officerId], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return reject(new Error("Database error"));
      }

      if (results.length === 0) {
        return reject(new Error("Officer not found"));
      }

      resolve(results[0]); 
    });
  }
)
}

exports.getmyprofile = async (officerId) =>{
  console.log("userID", officerId)
return new Promise((resolve, reject) => {
  let sql = `
  SELECT empId,firstName, firstNameSinhala,firstNameTamil, lastName, lastNameSinhala, lastNameTamil, profile as profileImg, phoneNumber1,phoneNumber2,nic,
  house,city,street,email
  FROM feildofficer
  WHERE id = ?
  `

db.plantcare.query(sql, [officerId], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return reject(new Error("Database error"));
      }

      if (results.length === 0) {
        return reject(new Error("Officer not found"));
      }

      resolve(results[0]); 
    });
  }
)
}
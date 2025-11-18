const db = require('../startup/database');
const bcrypt = require('bcrypt');

exports.loginUser = async (empId, password) => {
  try {
    const sql = `
      SELECT empId, password, id, JobRole AS role,status, passwordUpdated AS passwordUpdate,companyId 
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
      status: user.status,
      companyId: user.companyId
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

exports.changePassword = async (officerId, currentPassword, newPassword) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT password
      FROM feildofficer
      WHERE id = ?
    `;    
    db.plantcare.query(sql, [officerId], async (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return reject(new Error("Database error"));
      }
      if (results.length === 0) {
        return reject(new Error("Officer not found"));
      }
      const user = results[0];
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return reject(new Error("Current password is incorrect"));
      }
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updateSql = `
        UPDATE feildofficer
        SET password = ?, passwordUpdated = 1
        WHERE id = ?
      `;
      db.plantcare.query(updateSql, [hashedNewPassword, officerId], (updateErr, updateResults) => {
        if (updateErr) {
          console.error("Database error:", updateErr.message);
          return reject(new Error("Database error"));
        }
        resolve({ success: true, message: "Password changed successfully" });
      });
    });
  });
};
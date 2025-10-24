const db = require('../startup/database');
const bcrypt = require('bcrypt');

exports.loginUser = async (empId, password) => {
  try {
    const sql = `
      SELECT empId, password, id, JobRole AS role,status, passwordUpdated AS passwordUpdate
      FROM feildofficer
      WHERE empId = ?
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
    throw new Error('Database error: ' + err.message);
  }
};
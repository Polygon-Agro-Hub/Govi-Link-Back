const db = require('../startup/database');
const bcrypt = require('bcrypt');

exports.loginUser = (empId, password) => {
  console.log(empId)
  return new Promise(async (resolve, reject) => {
    try {
      const sql = 'SELECT empId, password, id, passwordUpdate FROM govilink WHERE empId = ?';
      const [results] = await db.marketPlace.promise().query(sql, [empId]);

      if (results.length === 0) {
        return reject(new Error('User not found'));
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return reject(new Error('Invalid password'));
      }

      resolve({ success: true, empId: user.empId, id: user.id, passwordUpdate: user.passwordUpdate });
    } catch (err) {
      return reject(new Error('Database error: ' + err.message));
    }
  });
};

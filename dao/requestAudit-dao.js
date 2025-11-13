const db = require('../startup/database');

exports.saveProblem = (data) => {
  const { govilinkjobid, problem, solution, imageUrl } = data;

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO govijoblinksuggestions (jobId, farmerFeedback, advice, image)
      VALUES (?, ?, ?, ?)
    `;

    db.plantcare.query(
      sql,
      [govilinkjobid, problem, solution, imageUrl],
      (err, result) => {
        if (err) {
          console.error("❌ Database error (insert problem):", err.message);
          return reject(new Error("Database error while saving problem"));
        }

        if (result.affectedRows === 0) {
          console.warn("⚠️ Problem insert failed:", data);
          return reject(new Error("Problem not saved"));
        }

        console.log("✅ Problem saved successfully:", data);
        resolve({ id: result.insertId, ...data });
      }
    );
  });
};
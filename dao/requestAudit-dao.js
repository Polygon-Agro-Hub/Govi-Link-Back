const db = require('../startup/database');

exports.saveProblem = (data) => {
  const { govilinkjobid, farmerFeedback, advice, imageUrl } = data;

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO govijoblinksuggestions (jobId, farmerFeedback, advice, image)
      VALUES (?, ?, ?, ?)
    `;

    db.plantcare.query(
      sql,
      [govilinkjobid, farmerFeedback, advice, imageUrl],
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

exports.getProblemsByJobId = async (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, farmerFeedback, advice, image
      FROM govijoblinksuggestions
      WHERE jobId = ?
      LIMIT 1
    `;
    db.plantcare.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
      console.log("✅ Fetched problem for jobId", id, ":", results[0] || null);
    });
  });
};


exports.updateProblem = async ({ id, farmerFeedback, advice, image }) => {
  console.log("🔄 Updating problem ID:", id, "with data:", { farmerFeedback, advice, image });
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE govijoblinksuggestions
      SET farmerFeedback = ?, advice = ?, image = ?
      WHERE jobId = ?
    `;
    db.plantcare.query(sql, [farmerFeedback, advice, image, id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};





exports.setsaveidentifyProblem = async (payload) => {
  console.log("DAO: Saving problem → Payload:", payload);

  return new Promise((resolve, reject) => {
    const { problem, solution, govilinkjobid } = payload;

      // Step 2: Proceed with insert into jobsuggestions
      const insertSql = `
        INSERT INTO govijoblinkproblems (jobId, problem, solution, createdAt)
        VALUES (?, ?, ?, NOW())
      `;

      db.plantcare.query(insertSql, [govilinkjobid, problem, solution], (err, result) => {
        if (err) {
          console.error("❌ DB error inserting problem:", err.message);
          return reject(new Error("Database error while saving problem"));
        }

        console.log("✅ Problem saved successfully → ID:", result.insertId);
        resolve({ id: result.insertId });
      });

  });
};

exports.getidentifyProblemsSolutionsById = async (id) => {
  console.log("DAO: Fetching problems for id →", id);

  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, problem, solution, createdAt
      FROM govijoblinkproblems
      WHERE jobId = ?
        ORDER BY createdAt ASC
    `;

    db.plantcare.query(sql, [id], (err, results) => {
      if (err) {
        console.error("❌ DB error fetching problems:", err.message);
        return reject(new Error("Database error while fetching problems"));
      }

      console.log("✅ Problems fetched successfully → Count:", results.length);
      resolve(results);
    });
  });
};

exports.updateidentifyProblem = async (id, payload) => {
  console.log("DAO: Updating problem → ID:", id, "| Payload:", payload);

  return new Promise((resolve, reject) => {
    const { problem, solution } = payload;

    if (!id ) {
      console.error("❌ Missing id or officerId");
      return reject(new Error("Invalid input"));
    }

    const updateSql = `
      UPDATE govijoblinkproblems
      SET problem = ?, solution = ?
      WHERE id = ? 
    `;

    db.plantcare.query(updateSql, [problem, solution, id], (err, result) => {
      if (err) {
        console.error("❌ DB error updating problem:", err.message);
        return reject(new Error("Database error while updating problem"));
      }

      if (result.affectedRows === 0) {
        return reject(new Error("Problem not found or not authorized to update"));
      }

      console.log("✅ Problem updated successfully → ID:", id);
      resolve({ id });
    });
  });
};


exports.setcomplete = async (id) => {
  console.log("🔄 Updating job ID:", id);

  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE govilinkjobs
      SET status = 'Completed'
      WHERE id = ?
    `;

    db.plantcare.query(sql, [id], (err, result) => {
      if (err) {
        console.error("❌ Database error:", err);
        return reject(err);
      }

      if (result.affectedRows > 0) {
        resolve({
          success: true,
          message: "Audit marked as finished successfully.",
        });
      } else {
        resolve({
          success: false,
          message: "No matching job found or status not updated.",
        });
      }
    });
  });
};

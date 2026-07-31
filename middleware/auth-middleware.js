const jwt = require("jsonwebtoken");
const db = require("../startup/database");

const auth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    console.error("No token provided");
    return res.status(401).json({
      status: "error",
      message: "No token provided",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }

    try {
      // Fetch status from the database to check if account is banned/pending/rejected
      const sql = "SELECT status FROM feildofficer WHERE id = ?";
      const [results] = await db.plantcare.promise().query(sql, [decoded.id]);

      if (results.length === 0) {
        return res.status(401).json({
          status: "error",
          message: "User not found",
        });
      }

      const status = results[0].status;

      if (status === "Rejected") {
        return res.status(403).json({
          success: false,
          message: "This Employee ID is Rejected",
          statusType: "rejected",
        });
      }

      if (status === "Not Approved") {
        return res.status(403).json({
          success: false,
          message: "User not approved",
          statusType: "not_approved",
        });
      }

      if (status === "Pending") {
        return res.status(403).json({
          success: false,
          message: "Account status is pending verification",
          statusType: "pending",
        });
      }

      if (status !== "Approved") {
        return res.status(403).json({
          success: false,
          message: "User not approved",
          statusType: "not_approved",
        });
      }

      req.user = decoded;
      next();
    } catch (dbErr) {
      console.error("Database query failed in auth middleware:", dbErr);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  });
};

module.exports = auth;

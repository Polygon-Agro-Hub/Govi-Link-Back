const requestAuditDao = require("../dao/requestAudit-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const uploadFileToR2 = require('../Middlewares/s3upload');
const delectfilesOnR2 = require('../Middlewares/s3delete')

exports.setsaveProblem = async (req, res) => {
    console.log("📝 Received saveProblem request:", req.body);
  try {
    const { id } = req.params;
    const { problem, solution } = req.body;

    if (!problem || !solution) {
      return res.status(400).json({
        success: false,
        message: "Problem and solution are required.",
      });
    }

    let imageUrl = null;

    // ✅ If image uploaded, upload to R2
    if (req.file) {
      const fileName = Date.now() + "-" + req.file.originalname;
      const uploadedImage = await uploadFileToR2(req.file.buffer, fileName, `govilink/requestproblem`);
      imageUrl = uploadedImage;
      console.log("✅ Uploaded Image URL:", imageUrl);
    }

    // ✅ Save to DB (use your DAO)
    await requestAuditDao.saveProblem({
      govilinkjobid: id,
      problem,
      solution,
      imageUrl,
    });

    res.json({
      success: true,
      message: "Problem and solution saved successfully.",
    });
  } catch (err) {
    console.error("❌ Error saving problem:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
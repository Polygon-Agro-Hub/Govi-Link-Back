const requestAuditDao = require("../dao/requestAudit-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const uploadFileToR2 = require('../Middlewares/s3upload');
const delectfilesOnR2 = require('../Middlewares/s3delete')

exports.setsaveProblem = async (req, res) => {
    console.log("📝 Received saveProblem request:", req.body);
  try {
    const { id } = req.params;
    const { farmerFeedback, advice } = req.body;

    if (!farmerFeedback || !advice) {
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
      farmerFeedback,
      advice,
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

exports.getProblemsByJobId = async (req, res) => {
  try {
    const {id } = req.params;

    const problem = await requestAuditDao.getProblemsByJobId(id);

    if (problem) {
      res.json({ success: true, data: problem });
    } else {
      res.json({ success: true, data: null, message: "No problem found for this job." });
    }
  } catch (err) {
    console.error("❌ Error fetching problem:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { farmerFeedback, advice } = req.body;
    let image = null;
    console.log("📝 Received updateProblem request:", req.body);

    // ✅ Fetch existing problem to check for existing image
    const existingProblem = await requestAuditDao.getProblemsByJobId(id);
    console.log("ℹ️ Existing problem fetched for update:", existingProblem);
    const existingTaskImage = existingProblem?.image ? { uploadImage: existingProblem.image } : null;

    // ✅ If a new image is uploaded, delete old image first
    if (req.file) {
      if (existingTaskImage?.uploadImage) {
        console.log("🗑️ Deleting old image from R2:", existingTaskImage.uploadImage);
        await delectfilesOnR2(existingTaskImage.uploadImage);
      }

      const fileName = Date.now() + "-" + req.file.originalname;
      const uploadedImage = await uploadFileToR2(req.file.buffer, fileName, `govilink/requestproblem`);
      image= uploadedImage;
      console.log("✅ Uploaded New Image URL:", image);
    }

    // ✅ Update problem in DB
    await requestAuditDao.updateProblem({
      id,
      farmerFeedback,
      advice,
      image,
    });

    res.json({
      success: true,
      message: "Problem and solution updated successfully.",
    });
  } catch (err) {
    console.error("❌ Error updating problem:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};



exports.setsaveidentifyProblem = asyncHandler(async (req, res) => {
  const payload = req.body;
  console.log("✅ Controller hit → setCheckQuestions | Question ID:", payload);

  try {
    const { id } = await requestAuditDao.setsaveidentifyProblem(payload); // <-- capture return value

    return res.status(200).json({
      success: true,
      message: "Problem saved successfully",
      id, // now defined
    });
  } catch (error) {
    console.error("❌ Error in setsaveProblem:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save problem",
    });
  }
});

exports.getidentifyProblemsSolutionsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const problems = await requestAuditDao.getidentifyProblemsSolutionsById(id);
    return res.status(200).json({
      success: true,
      count: problems.length,
      data: problems,
    });
  } catch (error) {
    console.error("❌ Error in getProblemsBySlaveId:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch problems",
    });
  }
});


exports.updateidentifyProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  try {
    const { id: updatedId } = await requestAuditDao.updateidentifyProblem(id, payload);

    return res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      id: updatedId,
    });
  } catch (error) {
    console.error("❌ Error in updateProblem:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update problem",
    });
  }
});

exports.setcomplete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("🔥 HITT COMPLETE →", id);

  try {
    const result = await requestAuditDao.setcomplete(id);
    console.log("✅ Audit status updated:", result);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message || "Audit status updated successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || "Failed to update audit status",
      });
    }
  } catch (error) {
    console.error("❌ Error in setcomplete controller:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating audit",
    });
  }
});
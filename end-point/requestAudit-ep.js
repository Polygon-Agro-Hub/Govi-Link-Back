const requestAuditDao = require("../dao/requestAudit-dao");
const asyncHandler = require("express-async-handler");
const uploadFileToR2 = require("../Middlewares/s3upload");
const delectfilesOnR2 = require("../Middlewares/s3delete");

exports.setsaveProblem = async (req, res) => {
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
    if (req.file) {
      const fileName = Date.now() + "-" + req.file.originalname;
      const uploadedImage = await uploadFileToR2(
        req.file.buffer,
        fileName,
        `govilink/requestproblem`,
      );
      imageUrl = uploadedImage;
    }

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
    console.error("Error saving problem:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.getProblemsByJobId = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await requestAuditDao.getProblemsByJobId(id);

    if (problem) {
      res.json({ success: true, data: problem });
    } else {
      res.json({
        success: true,
        data: null,
        message: "No problem found for this job.",
      });
    }
  } catch (err) {
    console.error("Error fetching problem:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { farmerFeedback, advice } = req.body;
    let image = null;

    const existingProblem = await requestAuditDao.getProblemsByJobId(id);
    const existingTaskImage = existingProblem?.image
      ? { uploadImage: existingProblem.image }
      : null;

    if (req.file) {
      if (existingTaskImage?.uploadImage) {
        await delectfilesOnR2(existingTaskImage.uploadImage);
      }

      const fileName = Date.now() + "-" + req.file.originalname;
      const uploadedImage = await uploadFileToR2(
        req.file.buffer,
        fileName,
        `govilink/requestproblem`,
      );
      image = uploadedImage;
    }

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
    console.error("Error updating problem:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.setsaveidentifyProblem = asyncHandler(async (req, res) => {
  const payload = req.body;
  try {
    const { id } = await requestAuditDao.setsaveidentifyProblem(payload);

    return res.status(200).json({
      success: true,
      message: "Problem saved successfully",
      id,
    });
  } catch (error) {
    console.error("Error in setsaveProblem:", error.message);

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
    console.error("Error in getProblemsBySlaveId:", error.message);
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
    const { id: updatedId } = await requestAuditDao.updateidentifyProblem(
      id,
      payload,
    );

    return res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      id: updatedId,
    });
  } catch (error) {
    console.error("Error in updateProblem:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update problem",
    });
  }
});

exports.setcomplete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await requestAuditDao.setcomplete(id);
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
    console.error("Error in setcomplete controller:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating audit",
    });
  }
});

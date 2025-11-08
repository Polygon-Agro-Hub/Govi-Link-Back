const officerDao = require("../dao/officer-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const uploadFileToR2 = require('../Middlewares/s3upload');
const delectfilesOnR2 = require('../Middlewares/s3delete')

exports.getOfficerVisits  = asyncHandler(async (req, res) => {
      const officerId = req.user.id;
      console.log(officerId)
      try{
      const officerVisits = await officerDao.getofficerVisits(officerId);
      
              res.status(200).json({
            status: "success",
            data: officerVisits,
          });
      }
      catch{

      }
})

exports.getOfficerVisitsDraft = asyncHandler(async (req, res) => {
  const officerId = req.user?.id;

  console.log("🧾 Officer ID (Draft):", officerId);

  if (!officerId) {
    return res.status(400).json({
      status: "error",
      message: "Officer ID is required",
    });
  }

  try {
    const draftVisits = await officerDao.getofficerVisitsDraft(officerId);
    if (!draftVisits) {
      return res.status(404).json({
        status: "error",
        message: "No data found for this officer",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Officer draft visit data retrieved successfully",
      data: draftVisits
    });
  } catch (error) {
    console.error("❌ Error fetching officer visits draft:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch officer visits draft",
    });
  }
});


exports.getindividualauditsquestions = asyncHandler(async (req, res) => {
  const { certificationpaymentId } = req.params;
  console.log("📩 Hit get to certificate question:", certificationpaymentId);

  if (!certificationpaymentId) {
    return res.status(400).json({
      status: "error",
      message: "Missing certificationpaymentId parameter",
    });
  }

  try {
    const individualauditsquestions = await officerDao.getindividualauditsquestions(certificationpaymentId);

    if (!individualauditsquestions || !individualauditsquestions.questions?.length) {
      return res.status(404).json({
        status: "error",
        message: "No questions found for this certification payment",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Individual audit questions fetched successfully",
      data: individualauditsquestions, // { logo, questions }
    });

    console.log("✅ individualauditsquestions:", individualauditsquestions);
  } catch (error) {
    console.error("❌ Error fetching audit questions:", error.message);

    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch individual audit questions",
    });
  }
});


exports.setCheckQuestions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tickResult } = req.body;

  console.log("✅ Controller hit → setCheckQuestions | Question ID:", id, "New tickResult:", tickResult);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Question ID is required",
    });
  }

  // ✅ Validate tickResult (must be 0 or 1)
  if (tickResult !== 0 && tickResult !== 1) {
    return res.status(400).json({
      success: false,
      message: "tickResult must be 0 or 1",
    });
  }

  try {
    await officerDao.setCheckQuestions(id, tickResult);

    return res.status(200).json({
      success: true,
      message: `tickResult updated successfully to ${tickResult}`,
      id,
      tickResult,
    });
  } catch (error) {
    console.error("❌ Error in setCheckQuestions:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update tickResult",
    });
  }
});


exports.setCheckPhotoProof = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("✅ Controller hit → setCheckPhotoProof | Question ID:", id);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Question ID is required",
    });
  }

  try {
    // 1️⃣ Check for existing image
    const existingTaskImage = await officerDao.getexistingTaskImageImage(id);

    if (existingTaskImage?.uploadImage) {
      console.log("🗑️ Deleting old image from R2:", existingTaskImage.uploadImage);
      await delectfilesOnR2(existingTaskImage.uploadImage);
    } else {
      console.log("ℹ️ No existing task image found");
    }

    // 2️⃣ Upload new image if provided
    let taskImageUrl = null;

    if (req.file) {
      const fileName = req.file.originalname;
      const imageBuffer = req.file.buffer;

      const uploadedImage = await uploadFileToR2(imageBuffer, fileName, `govilink/task`);
      taskImageUrl = uploadedImage;
      console.log("✅ Uploaded new image URL:", taskImageUrl);
    }


    await officerDao.setCheckPhotoProof(id, taskImageUrl);

    return res.status(200).json({
      success: true,
      message: "tickResult and image updated successfully",
      id,
      imageUrl: taskImageUrl,
    });
  } catch (error) {
    console.error("❌ Error in setCheckPhotoProof:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update photo proof",
    });
  }
});
exports.removePhotoProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
    const existingTaskImage = await officerDao.getexistingTaskImageImage(id);

    if (existingTaskImage?.uploadImage) {
      console.log("🗑️ Deleting old image from R2:", existingTaskImage.uploadImage);
      await delectfilesOnR2(existingTaskImage.uploadImage);
    } else {
      console.log("ℹ️ No existing task image found");
    }
  await officerDao.clearPhotoProofImage(id);
  res.status(200).json({ success: true, message: "Photo proof removed successfully" });
});


exports.setsaveProblem = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  const payload = req.body;
  console.log("✅ Controller hit → setCheckQuestions | Question ID:", payload);

  try {
    const { id } = await officerDao.setsaveProblem(payload, officerId); // <-- capture return value

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

exports.getProblemsSolutionsById = asyncHandler(async (req, res) => {
  const { slaveId } = req.params;

  try {
    const problems = await officerDao.getProblemsSolutionsBySlaveId(slaveId);

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


exports.updateProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  try {
    const { id: updatedId } = await officerDao.updateProblem(id, payload);

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

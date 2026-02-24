const officerDao = require("../dao/officer-dao");
const asyncHandler = require("express-async-handler");
const uploadFileToR2 = require("../Middlewares/s3upload");
const delectfilesOnR2 = require("../Middlewares/s3delete");
const {
  createFieldOfficerSchema,
} = require("../Validations/officer-validation");

exports.getVisits = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  try {
    const { visits, draftVisits } =
      await officerDao.getOfficerVisitsCombined(officerId);
    res.status(200).json({
      status: "success",
      data: {
        visits,
        draftVisits,
      },
    });
  } catch (error) {
    console.error("Error fetching visits:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch visits",
    });
  }
});

exports.getOfficerVisits = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  try {
    const officerVisits = await officerDao.getofficerVisits(officerId);
    res.status(200).json({
      status: "success",
      data: officerVisits,
    });
  } catch {}
});

exports.getOfficerVisitsDraft = asyncHandler(async (req, res) => {
  const officerId = req.user?.id;
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
      data: draftVisits,
    });
  } catch (error) {
    console.error("Error fetching officer visits draft:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch officer visits draft",
    });
  }
});

exports.getindividualauditsquestions = asyncHandler(async (req, res) => {
  const { certificationpaymentId } = req.params;
  const { clusterId, farmId } = req.query;

  if (!certificationpaymentId) {
    return res.status(400).json({
      status: "error",
      message: "Missing certificationpaymentId parameter",
    });
  }
  try {
    const individualauditsquestions =
      await officerDao.getindividualauditsquestions(
        certificationpaymentId,
        farmId,
        clusterId,
      );

    if (
      !individualauditsquestions ||
      !individualauditsquestions.questions?.length
    ) {
      return res.status(404).json({
        status: "error",
        message: "No questions found for this certification payment",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Individual audit questions fetched successfully",
      data: individualauditsquestions,
    });
  } catch (error) {
    console.error("Error fetching audit questions:", error.message);

    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch individual audit questions",
    });
  }
});

exports.setCheckQuestions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { officerTickResult } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Question ID is required",
    });
  }
  if (officerTickResult !== 0 && officerTickResult !== 1) {
    return res.status(400).json({
      success: false,
      message: "tickResult must be 0 or 1",
    });
  }
  try {
    await officerDao.setCheckQuestions(id, officerTickResult);

    return res.status(200).json({
      success: true,
      message: `tickResult updated successfully to ${officerTickResult}`,
      id,
      officerTickResult,
    });
  } catch (error) {
    console.error("Error in setCheckQuestions:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update tickResult",
    });
  }
});

exports.setCheckPhotoProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Question ID is required",
    });
  }
  try {
    const existingTaskImage = await officerDao.getexistingTaskImageImage(id);
    if (existingTaskImage?.uploadImage) {
      await delectfilesOnR2(existingTaskImage.uploadImage);
    } else {
      console.log("No existing task image found");
    }
    let taskImageUrl = null;

    if (req.file) {
      const fileName = req.file.originalname;
      const imageBuffer = req.file.buffer;

      const uploadedImage = await uploadFileToR2(
        imageBuffer,
        fileName,
        `govilink/task`,
      );
      taskImageUrl = uploadedImage;
    }
    await officerDao.setCheckPhotoProof(id, taskImageUrl);
    return res.status(200).json({
      success: true,
      message: "tickResult and image updated successfully",
      id,
      imageUrl: taskImageUrl,
    });
  } catch (error) {
    console.error("Error in setCheckPhotoProof:", error.message);
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
    await delectfilesOnR2(existingTaskImage.uploadImage);
  } else {
    console.log("No existing task image found");
  }
  await officerDao.clearPhotoProofImage(id);
  res
    .status(200)
    .json({ success: true, message: "Photo proof removed successfully" });
});

exports.setsaveProblem = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  const payload = req.body;

  try {
    const { id } = await officerDao.setsaveProblem(payload, officerId);

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
    console.error("Error in getProblemsBySlaveId:", error.message);
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
    console.error("Error in updateProblem:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update problem",
    });
  }
});

exports.setcomplete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  try {
    const result = await officerDao.setcomplete(id, payload);

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

exports.getVisitsbydate = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  const { date } = req.params;
  const { isOverdueSelected } = req.query;
  try {
    const visitsByDate = await officerDao.getVisitsbydate(
      officerId,
      date,
      isOverdueSelected,
    );
    res.status(200).json({
      status: "success",
      data: visitsByDate,
    });
  } catch (error) {
    console.error("Error fetching visits by date:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch visits by date",
    });
  }
});

exports.getFieldOfficers = asyncHandler(async (req, res) => {
  const irmId = req.user.id;
  const search = req.query.search || "";
  try {
    const fieldOfficers = await officerDao.getFieldOfficers(irmId, search);

    res.status(200).json({
      status: "success",
      data: fieldOfficers.data,
      count: fieldOfficers.count,
    });
  } catch (error) {
    console.error("Error in getFieldOfficers:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

exports.createFieldOfficer = asyncHandler(async (req, res) => {
  const irmId = req.user.id;
  const officerData = req.body;
  const files = req.files || {};

  try {
    if (typeof officerData.assignDistrict === "string") {
      try {
        officerData.assignDistrict = JSON.parse(officerData.assignDistrict);
      } catch (error) {
        console.log("assignDistrict is not JSON, using as is");
      }
    }
    const { error, value } = createFieldOfficerSchema.validate(officerData);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }
    const result = await officerDao.createFieldOfficer(irmId, value, files);

    res.status(201).json({
      status: "success",
      message: "Field officer created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in createFieldOfficer:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

exports.checkNicExists = asyncHandler(async (req, res) => {
  const { nic } = req.params;

  try {
    const exists = await officerDao.checkNicExists(nic);
    res.status(200).json({
      status: "success",
      exists: exists,
    });
  } catch (error) {
    console.error("Error checking NIC:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

exports.checkEmailExists = asyncHandler(async (req, res) => {
  const { email } = req.params;

  try {
    const exists = await officerDao.checkEmailExists(email);
    res.status(200).json({
      status: "success",
      exists: exists,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

exports.checkPhoneExists = asyncHandler(async (req, res) => {
  const { phoneCode, phoneNumber } = req.params;
  try {
    const exists = await officerDao.checkPhoneExists(phoneCode, phoneNumber);
    res.status(200).json({
      status: "success",
      exists: exists,
    });
  } catch (error) {
    console.error("Error checking phone:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

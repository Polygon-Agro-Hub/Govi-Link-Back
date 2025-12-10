const assignJobsdao = require("../dao/assignJobs-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

exports.getVisitsbydate = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  const { date } = req.params;
  const { isOverdueSelected } = req.query;
  console.log("Officer ID:", officerId, "Date:", date);
  try {
    const visitsByDate = await assignJobsdao.getVisitsbydate(
      officerId,
      date,
      isOverdueSelected
    );
    res.status(200).json({
      status: "success",
      data: visitsByDate,
    });
  } catch (error) {
    console.error("❌ Error fetching visits by date:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch visits by date",
    });
  }
});

// Get assign officer list
exports.getassignofficerlist = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  const { jobId, date } = req.params;
  const currentDate = new Date(date);

  console.log("Officer ID:", officerId, "Job ID:", jobId, "Date:", currentDate);

  try {
    const irmUsers = await assignJobsdao.getassignofficerlistDAO(
      officerId,
      currentDate,
      jobId
    );
    res.status(200).json({
      status: "success",
      data: irmUsers,
    });
  } catch (error) {
    console.error("Error fetching IRM users:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch IRM users",
    });
  }
});

// Assign officer to field audits
exports.assignOfficerToFieldAudits = asyncHandler(async (req, res) => {
  const { officerId, date, propose, fieldAuditIds, govilinkJobIds, auditType } =
    req.body;
  const assignedBy = req.user.id;

  console.log("Assigning officer request:", {
    officerId,
    date,
    assignedBy,
    propose,
    fieldAuditIds,
    govilinkJobIds,
    auditType,
  });

  try {
    // Validate required fields based on auditType
    if (!officerId || !date || !propose) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: officerId, date, and propose are required",
      });
    }

    // Validate that we have the correct IDs based on auditType
    if (
      auditType === "feildaudits" &&
      (!fieldAuditIds || fieldAuditIds.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing fieldAuditIds for feildaudits type",
      });
    }

    if (
      auditType === "govilinkjobs" &&
      (!govilinkJobIds || govilinkJobIds.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing govilinkJobIds for govilinkjobs type",
      });
    }

    const result = await assignJobsdao.assignOfficerToFieldAuditsDAO(
      officerId,
      date,
      assignedBy,
      propose,
      fieldAuditIds || [],
      govilinkJobIds || [],
      auditType
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error assigning officer to field audits:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to assign officer to field audits",
    });
  }
});
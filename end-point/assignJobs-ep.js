const assignJobsdao = require("../dao/assignJobs-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

exports.getVisitsbydate = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  const { date } = req.params;
  const {isOverdueSelected} = req.query;
  console.log("Officer ID:", officerId, "Date:", date);
  try {
    const visitsByDate = await assignJobsdao.getVisitsbydate(officerId, date, isOverdueSelected);
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
    const irmUsers = await assignJobsdao.getassignofficerlistDAO(officerId, currentDate, jobId);
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
  const { officerId, jobIds, date, propose, fieldAuditId } = req.body;
  const assignedBy = req.user.id; 

  console.log("Assigning officer request:", { 
    officerId, 
    jobIds, 
    date, 
    assignedBy,
    propose,
    fieldAuditId 
  });

  try {
    // Validate required fields
    if (!officerId || !jobIds || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: officerId, jobIds, and date are required"
      });
    }

    const result = await assignJobsdao.assignOfficerToFieldAuditsDAO(
      officerId, 
      jobIds, 
      date, 
      assignedBy,
      propose,    
      fieldAuditId   
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
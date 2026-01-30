const clusteAuditdao = require("../dao/cluterAudit-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const uploadFileToR2 = require('../Middlewares/s3upload');
const delectfilesOnR2 = require('../Middlewares/s3delete')

exports.getclusterVisits = asyncHandler(async (req, res) => {
  const feildauditId = req.params.id
  console.log("hitt cluster audit visits", feildauditId)
  try {
    const clusterVisits = await clusteAuditdao.getclusterVisits(feildauditId);

    res.status(200).json({
      status: "success",
      data: clusterVisits,
    });
  }
  catch {

  }
})


exports.UpdateStatus = asyncHandler(async (req, res) => {
  const feildauditId = req.params.id;
  const { jobId } = req.body;

  console.log("Updating status for ID:", feildauditId, "JobID:", jobId);

  try {
    const result = await clusteAuditdao.UpdateStatus(feildauditId, jobId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});


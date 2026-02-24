const clusteAuditdao = require("../dao/cluterAudit-dao");
const asyncHandler = require("express-async-handler");

exports.getclusterVisits = asyncHandler(async (req, res) => {
  const feildauditId = req.params.id;
  try {
    const clusterVisits = await clusteAuditdao.getclusterVisits(feildauditId);

    res.status(200).json({
      status: "success",
      data: clusterVisits,
    });
  } catch (error) {
    console.error("Error fetching cluster visits:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

exports.UpdateStatus = asyncHandler(async (req, res) => {
  const feildauditId = req.params.id;
  const { jobId } = req.body;

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

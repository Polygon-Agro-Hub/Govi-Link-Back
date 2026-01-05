const capitalRequesDao = require("../dao/capitalRequest-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const uploadFileToR2 = require('../Middlewares/s3upload');
const delectfilesOnR2 = require('../Middlewares/s3delete')

exports.getRequests = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  console.log("Officer ID:", officerId);

  try {
    const requests = await capitalRequesDao.getCapitalRequest(officerId);

    res.status(200).json({
      status: "success",
        requests
      
    });
  } catch (error) {
    console.error("❌ Error fetching visits:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch visits",
    });
  }
});

exports.getRequestByid = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("request id", id);

  try {
    const requests = await capitalRequesDao.getCapitalRequestById(id);

    res.status(200).json({
      status: "success",
        requests
      
    });
  } catch (error) {
    console.error("❌ Error fetching visits:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch visits",
    });
  }
});
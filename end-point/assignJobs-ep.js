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
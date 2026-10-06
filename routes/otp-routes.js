const express = require("express");
const router = express.Router();
const otpEp = require("../end-point/otp-ep");

// POST /govilink/api/otp/send
router.post("/send", otpEp.sendOtp);

// POST /govilink/api/otp/verify
router.post("/verify", otpEp.verifyOtp);

module.exports = router;

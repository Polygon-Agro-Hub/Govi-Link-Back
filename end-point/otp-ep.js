const axios = require("axios");
const asyncHandler = require("express-async-handler");

const SHOUTOUT_SEND_URL = "https://api.getshoutout.com/otpservice/send";
const SHOUTOUT_VERIFY_URL = "https://api.getshoutout.com/otpservice/verify";

/**
 * Send OTP via ShoutOUT
 * POST /govilink/api/otp/send
 * Body: { destination: string, message?: string }
 */
exports.sendOtp = asyncHandler(async (req, res) => {
  const { destination, message } = req.body;

  if (!destination) {
    return res.status(400).json({
      success: false,
      message: "Destination phone number is required",
    });
  }

  const apiKey = process.env.SHOUTOUT_API_KEY;
  if (!apiKey) {
    console.error("SHOUTOUT_API_KEY is not defined in environment variables");
    return res.status(500).json({
      success: false,
      message: "SMS service configuration error",
    });
  }

  const formattedDestination = destination.trim();
  const smsContent = message || "Your code is {{code}}";

  const headers = {
    Authorization: `Apikey ${apiKey.trim()}`,
    "Content-Type": "application/json",
  };

  const body = {
    source: "Polygon",
    transport: "sms",
    content: {
      sms: smsContent,
    },
    destination: formattedDestination,
  };

  try {
    const response = await axios.post(SHOUTOUT_SEND_URL, body, { headers });

    return res.status(200).json({
      success: true,
      referenceId: response.data?.referenceId,
      ...response.data,
    });
  } catch (error) {
    console.error(
      "Error sending OTP in ShoutOUT:",
      error?.response?.data || error.message
    );
    return res.status(error?.response?.status || 500).json({
      success: false,
      message: "Failed to send OTP",
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * Verify OTP via ShoutOUT
 * POST /govilink/api/otp/verify
 * Body: { code: string, referenceId: string }
 */
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { code, referenceId } = req.body;

  if (!code || !referenceId) {
    return res.status(400).json({
      statusCode: "1001",
      message: "Code and referenceId are required",
    });
  }

  const apiKey = process.env.SHOUTOUT_API_KEY;
  if (!apiKey) {
    console.error("SHOUTOUT_API_KEY is not defined in environment variables");
    return res.status(500).json({
      statusCode: "1001",
      message: "SMS service configuration error",
    });
  }

  const headers = {
    Authorization: `Apikey ${apiKey.trim()}`,
    "Content-Type": "application/json",
  };

  const body = {
    code: String(code).trim(),
    referenceId: String(referenceId).trim(),
  };

  try {
    const response = await axios.post(SHOUTOUT_VERIFY_URL, body, { headers });
    return res.status(200).json(response.data);
  } catch (apiError) {
    const errData = apiError.response?.data;
    if (errData && errData.statusCode) {
      return res.status(200).json(errData);
    }
    console.error(
      "Error verifying OTP in ShoutOUT:",
      errData || apiError.message
    );
    return res.status(apiError?.response?.status || 500).json({
      statusCode: errData?.statusCode || "1001",
      message: errData?.message || "OTP verification failed",
      error: apiError.message,
    });
  }
});

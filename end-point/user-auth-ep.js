const userDao = require("../dao/user-auth-dao");
const jwt = require("jsonwebtoken");
const { loginSchema } = require("../validation/auth-validations");
const asyncHandler = require("express-async-handler");

exports.login = asyncHandler(async (req, res) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  console.log(error);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((err) => err.message),
    });
  }

  const { empId, password } = req.body;
  try {
    const result = await userDao.loginUser(empId, password);
    if (result.status === "Rejected") {
      return res.status(403).json({
        success: false,
        message: "This Employee ID is Rejected",
        status: result.status,
      });
    }
    if (result.status === "Not Approved") {
      return res.status(403).json({
        success: false,
        message: "User not approved",
        status: result.status,
      });
    }
    const payload = {
      empId: result.empId,
      id: result.id,
      role: result.role || "user",
      passwordUpdate: result.passwordUpdate,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        empId: result.empId,
        id: result.id,
        role: result.role,
        token,
        passwordUpdate: result.passwordUpdate,
        status: result.status,
      },
    });
  } catch (err) {
    console.error("Login failed:", err.message);
    return res.status(401).json({ success: false, message: err.message });
  }
});

exports.getprofile = asyncHandler(async (req, res) => {
  const officerId = req.user?.id;
  if (!officerId) {
    return res
      .status(400)
      .json({ status: "error", message: "Officer is not authenticated" });
  }
  try {
    const officerProfile = await userDao.getprofile(officerId);

    res.status(200).json({
      status: "success",
      data: officerProfile,
    });
  } catch (error) {
    console.error("Error fetching officer details:", error.message);

    if (error.message === "Officer not found") {
      return res
        .status(404)
        .json({ status: "error", message: "Officer not found" });
    }

    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching officer details",
    });
  }
});

exports.getmyprofile = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  if (!officerId) {
    return res
      .status(400)
      .json({ status: "error", message: "Officer is not authenticated" });
  }
  try {
    const officerProfile = await userDao.getmyprofile(officerId);

    res.status(200).json({
      status: "success",
      data: officerProfile,
    });
  } catch (error) {
    console.error("Error fetching officer details:", error.message);

    if (error.message === "Officer not found") {
      return res
        .status(404)
        .json({ status: "error", message: "Officer not found" });
    }

    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching officer details",
    });
  }
});

exports.changePassword = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const result = await userDao.changePassword(
      officerId,
      currentPassword,
      newPassword,
    );
    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    console.error("Error changing password:", error.message);

    if (error.message === "Current password is incorrect") {
      return res.status(401).json({
        status: "error",
        message: error.message,
      });
    }

    if (error.message === "Officer not found") {
      return res.status(404).json({
        status: "error",
        message: error.message,
      });
    }

    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

exports.getCFODistricts = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  if (!officerId) {
    return res
      .status(400)
      .json({ status: "error", message: "Officer is not authenticated" });
  }
  try {
    const officerdistricts = await userDao.getCFODistricts(officerId);

    res.status(200).json({
      status: "success",
      data: officerdistricts,
    });
  } catch (error) {
    console.error("Error fetching officer details:", error.message);

    if (error.message === "Officer not found") {
      return res
        .status(404)
        .json({ status: "error", message: "Officer not found" });
    }

    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching officer details",
    });
  }
});

const userDao = require("../dao/userAuth-dao");
const jwt = require("jsonwebtoken");
const { loginSchema} = require("../Validations/Auth-validations");
const asyncHandler = require("express-async-handler");

exports.login = asyncHandler(async (req, res) => {
  console.log("hit login")
  // Validate request body using Joi
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  console.log(error)

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((err) => err.message),
    });
  }

  const { empId, password } = req.body;
  console.log("Login request received:", req.body);

  try {
    const result = await userDao.loginUser(empId, password);
    console.log("User login successful:", result);

 // Define JWT payload
    const payload = {
      empId: result.empId,
      id: result.id,
      role: result.role || "user",
      passwordUpdate: result.passwordUpdate,
      iat: Math.floor(Date.now() / 1000),
    };

    // Create JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

    // Send token as HTTP-only cookie (more secure)
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    // Send response with token
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        empId: result.empId,
        id: result.id,
        role: result.role,
        token,
        passwordUpdate: result.passwordUpdate,
        status: result.status
      },
    });
  } catch (err) {
    console.error("Login failed:", err.message);
    return res.status(401).json({ success: false, message: err.message });
  }
});


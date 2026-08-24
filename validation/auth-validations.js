const Joi = require("joi");

// Login Schema
const loginSchema = Joi.object({
  empId: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Employee ID is required",
    "string.min": "Employee ID must be at least 3 characters long",
    "string.max": "Employee ID must be at most 50 characters long",
  }),
  password: Joi.string().trim().required().messages({
    "string.empty": "Password is required",
  }),
});

module.exports = {
  loginSchema,
};

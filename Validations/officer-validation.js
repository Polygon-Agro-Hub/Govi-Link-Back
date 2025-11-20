const Joi = require("joi");

// Create Field Officer Schema
const createFieldOfficerSchema = Joi.object({
    empType: Joi.string().trim().valid('Permanent', 'Temporary').required().messages({
        "string.empty": "Employee type is required",
        "any.only": "Employee type must be Permanent or Temporary"
    }),
     languages: Joi.alternatives().try(
        Joi.object({
            Sinhala: Joi.boolean().required(),
            English: Joi.boolean().required(),
            Tamil: Joi.boolean().required()
        }),
        Joi.string()
    ).required().messages({
        "any.required": "Languages are required"
    }),
        assignDistrict: Joi.array().items(Joi.string().trim()).min(1).required().messages({
        "array.min": "At least one district must be assigned",
        "any.required": "Assign district is required"
    }),
    firstName: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "First name is required",
        "string.min": "First name must be at least 1 character long",
        "string.max": "First name must be at most 50 characters long"
    }),
    firstNameSinhala: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "Sinhala first name is required",
        "string.min": "Sinhala first name must be at least 1 character long",
        "string.max": "Sinhala first name must be at most 50 characters long"
    }),
    firstNameTamil: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "Tamil first name is required",
        "string.min": "Tamil first name must be at least 1 character long",
        "string.max": "Tamil first name must be at most 50 characters long"
    }),
    lastName: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "Last name is required",
        "string.min": "Last name must be at least 1 character long",
        "string.max": "Last name must be at most 50 characters long"
    }),
    lastNameSinhala: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "Sinhala last name is required",
        "string.min": "Sinhala last name must be at least 1 character long",
        "string.max": "Sinhala last name must be at most 50 characters long"
    }),
    lastNameTamil: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "Tamil last name is required",
        "string.min": "Tamil last name must be at least 1 character long",
        "string.max": "Tamil last name must be at most 50 characters long"
    }),
    phoneCode1: Joi.string().trim().min(1).max(5).required().messages({
        "string.empty": "Phone code 1 is required",
        "string.min": "Phone code 1 must be at least 1 character long",
        "string.max": "Phone code 1 must be at most 5 characters long"
    }),
    phoneNumber1: Joi.string().trim().min(9).max(12).pattern(/^\d+$/).required().messages({
        "string.empty": "Phone number 1 is required",
        "string.min": "Phone number 1 must be at least 9 digits long",
        "string.max": "Phone number 1 must be at most 12 digits long",
        "string.pattern.base": "Phone number 1 must contain only digits"
    }),
    phoneCode2: Joi.string().trim().min(1).max(5).optional().allow('').messages({
        "string.min": "Phone code 2 must be at least 1 character long",
        "string.max": "Phone code 2 must be at most 5 characters long"
    }),
    phoneNumber2: Joi.string().trim().min(9).max(12).pattern(/^\d+$/).optional().allow('').messages({
        "string.min": "Phone number 2 must be at least 9 digits long",
        "string.max": "Phone number 2 must be at most 12 digits long",
        "string.pattern.base": "Phone number 2 must contain only digits"
    }),
    nic: Joi.string().trim().min(10).max(15).required().messages({
        "string.empty": "NIC is required",
        "string.min": "NIC must be at least 10 characters long",
        "string.max": "NIC must be at most 15 characters long"
    }),
    email: Joi.string().trim().email().max(255).required().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email address",
        "string.max": "Email must be at most 255 characters long"
    }),
    house: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "House is required",
        "string.min": "House must be at least 1 character long",
        "string.max": "House must be at most 50 characters long"
    }),
    street: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "Street is required",
        "string.min": "Street must be at least 1 character long",
        "string.max": "Street must be at most 50 characters long"
    }),
    city: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "City is required",
        "string.min": "City must be at least 1 character long",
        "string.max": "City must be at most 50 characters long"
    }),
    distrct: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "District is required",
        "string.min": "District must be at least 1 character long",
        "string.max": "District must be at most 50 characters long"
    }),
    province: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "Province is required",
        "string.min": "Province must be at least 1 character long",
        "string.max": "Province must be at most 50 characters long"
    }),
    country: Joi.string().trim().min(1).max(50).required().messages({
        "string.empty": "Country is required",
        "string.min": "Country must be at least 1 character long",
        "string.max": "Country must be at most 50 characters long"
    }),
    comAmount: Joi.number().precision(2).min(0).required().messages({
        "number.base": "Commission amount must be a number",
        "number.min": "Commission amount must be at least 0",
        "number.precision": "Commission amount must have at most 2 decimal places"
    }),
    accName: Joi.string().trim().min(1).max(25).required().messages({
        "string.empty": "Account name is required",
        "string.min": "Account name must be at least 1 character long",
        "string.max": "Account name must be at most 25 characters long"
    }),
    accNumber: Joi.string().trim().min(1).max(25).required().messages({
        "string.empty": "Account number is required",
        "string.min": "Account number must be at least 1 character long",
        "string.max": "Account number must be at most 25 characters long"
    }),
    bank: Joi.string().trim().min(1).max(225).required().messages({
        "string.empty": "Bank is required",
        "string.min": "Bank must be at least 1 character long",
        "string.max": "Bank must be at most 225 characters long"
    }),
    branch: Joi.string().trim().min(1).max(225).required().messages({
        "string.empty": "Branch is required",
        "string.min": "Branch must be at least 1 character long",
        "string.max": "Branch must be at most 225 characters long"
    })
});

module.exports = {
    createFieldOfficerSchema
};
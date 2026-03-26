const onboardSupplierDao = require("../dao/onboard-supplier-dao");
const emailService = require("../server/email-service");
const asyncHandler = require("express-async-handler");

exports.createSupplier = asyncHandler(async (req, res) => {
    try {
        const { supplierName, contact, email, nic } = req.body;

        if (!supplierName || !contact || !email || !nic) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        const { insertId, tempPassword } = await onboardSupplierDao.createSupplier(
            supplierName,
            contact,
            email,
            nic,
        );

        try {
            await emailService.sendWelcomeEmail(
                supplierName,
                email,
                contact,
                tempPassword,
            );
        } catch (emailErr) {
            console.error("Email send failed:", emailErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Supplier created successfully.",
            supplierId: insertId,
        });
    } catch (err) {
        console.error("Error creating supplier:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

exports.checkAlreadyExist = asyncHandler(async (req, res) => {
    const { contact, email, nic } = req.query;

    if (!contact || !email || !nic) {
        return res.status(400).json({
            status: "error",
            message: "contact, email and nic are required",
        });
    }

    try {
        const { contactExists, emailExists, nicExists } =
            await onboardSupplierDao.checkAlreadyExist(contact, email, nic);

        return res.status(200).json({
            status: "success",
            contactExists,
            emailExists,
            nicExists,
            anyExists: contactExists || emailExists || nicExists,
        });
    } catch (error) {
        console.error("Error checking duplicates:", error);
        return res.status(500).json({ status: "error", message: error.message });
    }
});

const complaintDao = require("../dao/complaint-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const {
    createComplain
} = require('../validations/complain-validation');


exports.getComplainCategory = asyncHandler(async (req, res) => {
    try {
        const categories = await complaintDao.getComplainCategories();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "No categories found" });
        }

        res.status(200).json({ status: "success", data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
});


exports.createComplain = asyncHandler(async (req, res) => {

    try {
        const officerId= req.user.id;
        const input = { ...req.body, officerId };
        const today = new Date();
        const YYMMDD = today.toISOString().slice(2, 10).replace(/-/g, '');
        const datePrefix = `GC${YYMMDD}`;

        const { value, error } = createComplain.validate(input);
        const complaintsOnDate = await complaintDao.countComplaintsByDate(today);
        const referenceNumber = `${datePrefix}${String(complaintsOnDate + 1).padStart(4, '0')}`;

        const { language, complain, category } = value;
        const status = "Opened";

        const newComplainId = await complaintDao.createComplain(
            officerId,
            language,
            complain,
            category,
            status,
            referenceNumber
        );

        res.status(201).json({
            status: "success",
            message: "Complain created successfully.",
            complainId: newComplainId,
        });
    } catch (err) {
        console.error("Error creating complain:", err);

        res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
});

exports.getComplains = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        const complains = await complaintDao.getAllComplaintsByUserId(userId);

        if (!complains || complains.length === 0) {
            return res.status(404).json({ message: "No complaints found" });
        }

        res.status(200).json(complains);
    } catch (error) {
        console.error("Error fetching complaints:", error);
        res.status(500).json({ message: "Failed to fetch complaints" });
    }
});

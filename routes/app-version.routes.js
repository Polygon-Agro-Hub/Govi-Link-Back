const express = require("express");
const router = express.Router();
const appVersionEp = require("../end-point/app-version.ep");

// GET /api/app-version
router.get("/", appVersionEp.getAppVersion);
router.get("", appVersionEp.getAppVersion);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const requestAuditEp = require('../end-point/requestAudit-ep');
const upload = require('../Middlewares/multer.middleware');

router.post('/save-problem/:id',auth,upload.single('image'), requestAuditEp.setsaveProblem)

module.exports = router;
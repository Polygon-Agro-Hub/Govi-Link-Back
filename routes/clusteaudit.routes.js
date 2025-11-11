const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const cluterAuditEp = require('../end-point/cluterAudit-ep');
const upload = require('../Middlewares/multer.middleware');


router.get('/cluster-visits/:id',auth, cluterAuditEp.getclusterVisits)

module.exports = router;
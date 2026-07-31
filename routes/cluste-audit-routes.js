const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth-middleware');
const cluterAuditEp = require('../end-point/cluter-audit-ep');

router.get('/cluster-visits/:id', auth, cluterAuditEp.getclusterVisits);

router.post('/status/on-going/:id', auth, cluterAuditEp.UpdateStatus);

module.exports = router;
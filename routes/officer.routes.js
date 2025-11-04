const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const officerEp = require('../end-point/officer-ep');

router.get('/officer-visits',auth, officerEp.getOfficerVisits)

module.exports = router;
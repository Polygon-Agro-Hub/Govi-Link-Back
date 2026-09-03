const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth-middleware');
const complaintEp = require('../end-point/complaint-ep');
const checkProfanity = require('../middleware/profanity.middleware');

router.get('/get-complain-category', complaintEp.getComplainCategory );

router.post('/add-complaint', auth, checkProfanity(['complain']), complaintEp.createComplain );

router.get('/get-complains', auth, complaintEp.getComplains );

module.exports = router;
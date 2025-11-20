const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const complaintEp = require('../end-point/complaint-ep');

router.get('/get-complain-category', complaintEp.getComplainCategory );

router.post('/add-complaint', auth, complaintEp.createComplain );
router.get('/get-complains', auth, complaintEp.getComplains );

module.exports = router;
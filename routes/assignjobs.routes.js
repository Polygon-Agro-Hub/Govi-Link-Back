const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const assignJobsEp = require('../end-point/assignJobs-ep');
const upload = require('../Middlewares/multer.middleware');


router.get('/visits/:date',auth, assignJobsEp.getVisitsbydate)

// Get assign officer list
router.get('/get-assign-officer-list/:jobId/:date', auth, assignJobsEp.getassignofficerlist);

// Assign officer to field audits
router.post('/assign-officer-to-field-audits', auth, assignJobsEp.assignOfficerToFieldAudits);

module.exports = router;
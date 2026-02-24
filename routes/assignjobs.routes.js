const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const assignJobsEp = require('../end-point/assignJobs-ep');

router.get('/visits/:date',auth, assignJobsEp.getVisitsbydate);

router.get('/get-assign-officer-list/:jobId/:date', auth, assignJobsEp.getassignofficerlist);

router.post('/assign-officer-to-field-audits', auth, assignJobsEp.assignOfficerToFieldAudits);

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const assignJobsEp = require('../end-point/assignJobs-ep');
const upload = require('../Middlewares/multer.middleware');


router.get('/visits/:date',auth, assignJobsEp.getVisitsbydate)

module.exports = router;
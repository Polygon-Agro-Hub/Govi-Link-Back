const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const requestAuditEp = require('../end-point/requestAudit-ep');
const upload = require('../Middlewares/multer.middleware');

router.post('/save-problem/:id',auth,upload.single('image'), requestAuditEp.setsaveProblem)
router.get('/get-problem/:id',auth, requestAuditEp.getProblemsByJobId )
router.put('/update-problem/:id',auth,upload.single('image'), requestAuditEp.updateProblemById )

router.post('/save-identifyproblem', auth,  requestAuditEp.setsaveidentifyProblem)
router.get("/get-identifyproblems/:id", auth, requestAuditEp.getidentifyProblemsSolutionsById );
router.put("/update-identifyproblem/:id", auth, requestAuditEp.updateidentifyProblem);
router.put('/complete/:id', auth, requestAuditEp.setcomplete)

module.exports = router;
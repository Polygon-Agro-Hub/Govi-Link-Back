const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const officerEp = require('../end-point/officer-ep');
const upload = require('../Middlewares/multer.middleware');


router.get('/officer-visits',auth, officerEp.getOfficerVisits)
router.get('/individual-audits-questions/:certificationpaymentId', auth, officerEp.getindividualauditsquestions)
router.put('/check-question/:id', auth, officerEp.setCheckQuestions);
router.post('/upload-proof-photo/:id', auth, upload.single('taskphotoProof'), officerEp.setCheckPhotoProof);
router.delete("/remove-photo-proof/:id", officerEp.removePhotoProof);
router.get('/officer-visits-draft',auth, officerEp.getOfficerVisitsDraft)
router.post('/save-problem', auth, officerEp.setsaveProblem)
router.get("/get-problems/:slaveId", auth, officerEp.getProblemsSolutionsById );
router.put("/update-problem/:id", auth, officerEp.updateProblem);
router.put('/complete/:id', auth, officerEp.setcomplete)


router.get('/visits',auth, officerEp.getVisits)


module.exports = router;
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
router.get('/visits/:date',auth, officerEp.getVisitsbydate)

// Create Field Officer
router.post('/create-field-officer', 
    auth, 
    upload.fields([
        { name: 'profile', maxCount: 1 }, 
        { name: 'frontNic', maxCount: 1 },
        { name: 'backNic', maxCount: 1 },
        { name: 'backPassbook', maxCount: 1 },
        { name: 'contract', maxCount: 1 }
    ]), 
    officerEp.createFieldOfficer
);

// Get Field Officers
router.get('/get-field-officers', auth, officerEp.getFieldOfficers);

// Field Officers Check NIC Validation
router.get('/field-officers/check-nic/:nic', auth, officerEp.checkNicExists);

// Field Officers Check Email Validation
router.get('/field-officers/check-email/:email', auth, officerEp.checkEmailExists);

// Field Officers Check Phone Number Validation
router.get('/field-officers/check-phone/:phoneCode/:phoneNumber', auth, officerEp.checkPhoneExists);

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const capitaRequestEp = require('../end-point/capitalRequest-ep');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


router.get('/requests',auth,capitaRequestEp.getRequests )
router.get('/requests/:id',auth,capitaRequestEp.getRequestByid )
router.post('/inspection/save', upload.fields([
    { name: 'frontImg', maxCount: 1 },
    { name: 'backImg', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'waterImage', maxCount: 1 } 
  ]), capitaRequestEp.saveInspectionData);
router.get('/inspection/get', capitaRequestEp.getInspectionData);
router.delete('/inspection/delete/:reqId', capitaRequestEp.deleteInspectionData);

module.exports = router;
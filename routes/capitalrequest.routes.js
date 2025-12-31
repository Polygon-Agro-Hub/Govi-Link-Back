const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/auth.middleware');
const capitaRequestEp = require('../end-point/capitalRequest-ep');
const upload = require('../Middlewares/multer.middleware');


router.get('/requests',auth,capitaRequestEp.getRequests )
router.get('/requests/:id',auth,capitaRequestEp.getRequestByid )


module.exports = router;
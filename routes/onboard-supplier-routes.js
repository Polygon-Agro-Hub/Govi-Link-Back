const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth-middleware');
const onboardSupplierEp = require('../end-point/onboard-supplier-ep');

router.post('/add-supplier', auth, onboardSupplierEp.createSupplier);

router.get('/check-already-exist', auth, onboardSupplierEp.checkAlreadyExist);


module.exports = router;
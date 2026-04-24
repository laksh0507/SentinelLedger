const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const transactioncontroller = require('../controllers/transactioncontroller');

const router = Router();

// Updated to match the new controller function names
router.post("/transfer", authMiddleware.authMiddleware, transactioncontroller.createtransaction);
router.post("/system/initial-funds", authMiddleware.systemUserMiddleware, transactioncontroller.createinitialfundstransaction);

module.exports = router;
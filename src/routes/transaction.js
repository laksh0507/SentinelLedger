const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const transactioncontroller = require('../controllers/transactioncontroller');

const router = Router();

/**
 * @route POST /api/transaction/transfer
 * @access Private (Standard User)
 * @description Standard peer-to-peer money movement.
 */
router.post("/transfer", authMiddleware.authMiddleware, transactioncontroller.createtransaction);

/**
 * @route POST /api/transaction/system/initial-funds
 * @access Private (System User ONLY)
 * @description Injects "Genesis" funds into an account.
 * @security Verified by systemUserMiddleware to prevent unauthorized money creation.
 */
router.post("/system/initial-funds", authMiddleware.systemUserMiddleware, transactioncontroller.createinitialfundstransaction);

module.exports = router;
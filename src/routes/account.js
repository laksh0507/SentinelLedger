const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const accountcontroller = require('../controllers/accountcontroller');

const router = Router();

/**
 * @route POST /api/account/
 * @access Private (Registered users only)
 * @description Opens a new bank account.
 * @example { "currency": "INR" }
 */
router.post("/", authMiddleware, accountcontroller.createaccount);

/**
 * @route GET /api/account/balance
 * @access Private (Registered users only)
 * @description Gets the balance of the logged-in user's account.
 * @example { "currency": "INR" }
 */
router.get("/balance/:accountid", authMiddleware, accountcontroller.getbalance);
router.get("/statement/:accountid",authMiddleware,accountcontroller.getstatement);

module.exports = router;
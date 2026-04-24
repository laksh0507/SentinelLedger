const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const accountcontroller = require('../controllers/accountcontroller');

const router = Router();

/**
 * @route POST /api/account/
 * @description Opens a new bank account.
 */
router.post("/", authMiddleware, accountcontroller.createaccount);

/**
 * @route GET /api/account/all
 * @description List all active accounts for the logged-in user.
 */
router.get("/all", authMiddleware, accountcontroller.getallaccounts);

/**
 * @route GET /api/account/closed
 * @description List closed accounts history.
 */
router.get("/closed", authMiddleware, accountcontroller.getclosedaccounts);

/**
 * @route GET /api/account/balance/:accountid
 * @description Gets the balance of a specific account.
 */
router.get("/balance/:accountid", authMiddleware, accountcontroller.getbalance);

/**
 * @route GET /api/account/statement/:accountid
 * @description Gets the transaction history (ledger) for an account.
 */
router.get("/statement/:accountid", authMiddleware, accountcontroller.getstatement);

/**
 * @route PATCH /api/account/close/:accountid
 * @description Safely closes an account (requires zero balance and no pending txns).
 */
router.patch("/close/:accountid", authMiddleware, accountcontroller.closeaccount);

/**
 * @route DELETE /api/account/delete/:accountid
 * @description Permanently deletes a CLOSED account record.
 */
router.delete("/delete/:accountid", authMiddleware, accountcontroller.deleteaccount);

module.exports = router;
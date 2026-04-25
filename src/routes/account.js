const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const accountcontroller = require('../controllers/accountcontroller');

const router = Router();

/**
 * @route POST /api/accounts/
 * @description Opens a new bank account.
 */
router.post("/", authMiddleware, accountcontroller.createaccount);

/**
 * @route GET /api/accounts/
 * @description List all active accounts for the logged-in user.
 */
router.get("/", authMiddleware, accountcontroller.getallaccounts);

/**
 * @route GET /api/accounts/closed
 * @description List closed accounts history.
 */
router.get("/closed", authMiddleware, accountcontroller.getclosedaccounts);

/**
 * @route GET /api/accounts/balance/:accountId
 * @description Gets the balance of a specific account.
 */
router.get("/balance/:accountId", authMiddleware, accountcontroller.getbalance);

/**
 * @route GET /api/accounts/statement/:accountId
 * @description Gets the transaction history (ledger) for an account.
 */
router.get("/statement/:accountId", authMiddleware, accountcontroller.getstatement);

/**
 * @route PATCH /api/accounts/close/:accountId
 * @description Safely closes an account (requires zero balance and no pending txns).
 */
router.patch("/close/:accountId", authMiddleware, accountcontroller.closeaccount);

/**
 * @route DELETE /api/accounts/delete/:accountId
 * @description Permanently deletes a CLOSED account record.
 */
router.delete("/delete/:accountId", authMiddleware, accountcontroller.deleteaccount);

module.exports = router;
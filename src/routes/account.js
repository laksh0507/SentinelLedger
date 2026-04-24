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

module.exports = router;
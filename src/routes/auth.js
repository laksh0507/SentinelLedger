const { Router } = require('express');
const authcontroller = require("../controllers/authcontroller");

const router = Router();

/**
 * @route POST /api/auth/register
 * @description Creates a new user profile and sends a welcome email.
 */
router.post("/register", authcontroller.register);

/**
 * @route POST /api/auth/login
 * @description Authenticates user and returns a Secure/HttpOnly JWT cookie.
 */
router.post("/login", authcontroller.login);
router.post("/logout", authcontroller.logout);

module.exports = router;
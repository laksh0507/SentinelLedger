const accountmodel = require("../models/account");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

/**
 * @controller AccountController
 * @description Manages the user's financial containers.
 * @usage Users can call this to open their first account after registration.
 */

const createaccount = asyncHandler(async (req, res) => {
    const { currency } = req.body;
    const userId = req.user._id;

    // SDE-2 Pattern: Prevent a user from creating multiple accounts for now (or implement logic for it)
    const existingAccount = await accountmodel.findOne({ user: userId });
    if (existingAccount) {
        throw new ApiError(400, "User already has an active account");
    }

    const account = await accountmodel.create({
        user: userId,
        currency: currency || "INR",
        balance: 0 // Initializing with zero. Initial funds must come from the system API.
    });

    return res.status(201).json(new ApiResponse(201, account, "Account created successfully"));
});

module.exports = { createaccount };
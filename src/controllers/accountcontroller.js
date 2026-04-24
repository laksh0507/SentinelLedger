const accountModel = require("../models/account");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const createAccount = asyncHandler(async (req, res) => {
    const user = req.user;

    const existingAccount = await accountModel.findOne({ user: user._id });
    if (existingAccount) {
        throw new ApiError(400, "User already has an account");
    }

    const account = await accountModel.create({
        user: user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, account, "Bank account created successfully"));
});

module.exports = {
    createAccount
};
const usermodel = require("../models/user");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const emailservice = require("../services/email");

/**
 * @controller AuthController
 * @description Handles the "Entrance" to the system. 
 * Ensures every user is hashed, verified, and session-managed via JWT.
 */

const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields (name, email, password) are required");
    }

    const existeduser = await usermodel.findOne({ email });
    if (existeduser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Creating the user: The 'password' will be hashed automatically by the model hook.
    const user = await usermodel.create({
        email,
        password,
        name
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "10d" });

    // Security: Secure and HttpOnly flags prevent XSS and cookie theft.
    const options = {
        httpOnly: true,
        secure: true
    };

    // Notify user of successful registration
    try {
        await emailservice.sendregisteremail(email, name);
    } catch (error) {
        console.error("Email failed but user was registered:", error.message);
    }

    return res
        .status(201)
        .cookie("token", token, options)
        .json(new ApiResponse(201, { user: { _id: user._id, email, name } }, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // We must manually .select("+password") because it's hidden by default in the schema.
    const user = await usermodel.findOne({ email }).select("+password");

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const ispasswordcorrect = await user.comparePassword(password);
    if (!ispasswordcorrect) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "10d" });

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("token", token, options)
        .json(new ApiResponse(200, { user: { _id: user._id, email, name: user.name } }, "User logged in successfully"));
});

module.exports = { register, login };

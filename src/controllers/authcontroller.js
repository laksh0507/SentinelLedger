const usermodel = require("../models/user");
const jwt = require("jsonwebtoken");
const emailservice = require("../services/email");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const registerUser = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        throw new ApiError(400, "All fields are required");
    }

    const isUserExist = await usermodel.findOne({ email });
    if (isUserExist) {
        throw new ApiError(409, "User already exists with this email");
    }

    const user = await usermodel.create({
        email,
        password,
        name
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // SDE-2 Cookie security
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    // Note: We don't await email here so the response returns faster,
    // and we catch its internal errors to avoid crashing the registration logic.
    emailservice.sendregisteremail(email, name).catch(err => console.error("Async Email Error:", err));

    return res
        .status(201)
        .cookie("token", token, options)
        .json(new ApiResponse(201, { user: { _id: user._id, email, name} }, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await usermodel.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(401, "Invalid credentials or user not found");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .cookie("token", token, options)
        .json(new ApiResponse(200, { user: { _id: user._id, email, name: user.name } }, "User logged in successfully"));
});

module.exports = { registerUser, loginUser };

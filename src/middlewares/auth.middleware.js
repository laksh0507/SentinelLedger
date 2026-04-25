const usermodel = require("../models/user");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const blacklistModel = require("../models/blacklist");

/**
 * Standard User Authentication Middleware
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        throw new ApiError(401, "Unauthorized access, token is missing");
    }

    // Check if token is blacklisted
    const isBlacklisted = await blacklistModel.findOne({ token });
    if (isBlacklisted) {
        throw new ApiError(401, "Session expired or logged out. Please login again.");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await usermodel.findById(decoded.id);

        if (!user) {
            throw new ApiError(401, "Unauthorized access, user not found");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, "Invalid or expired token");
    }
});

/**
 * Privileged System User Middleware
 */
const systemUserMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        throw new ApiError(401, "Unauthorized access, token is missing");
    }

    // Check if token is blacklisted
    const isBlacklisted = await blacklistModel.findOne({ token });
    if (isBlacklisted) {
        throw new ApiError(401, "Session expired or logged out. Please login again.");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Corrected systemuser to systemUser
        const user = await usermodel.findById(decoded.id).select("+systemUser");
        
        if (!user || !user.systemUser) {
            throw new ApiError(401, "Unauthorized access, system user privilege required");
        }
        
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, "Invalid or expired token");
    }
});

module.exports = { authMiddleware, systemUserMiddleware };
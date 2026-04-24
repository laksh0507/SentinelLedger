const usermodel = require("../models/user");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

/**
 * Standard User Authentication Middleware
 * @description Verifies the JWT token from cookies. If valid, attaches the 
 * user object to 'req.user' for downstream access.
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        throw new ApiError(401, "Unauthorized access, token is missing");
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
        throw new ApiError(401, "Invalid or expired token");
    }
});

/**
 * Privileged System User Middleware
 * @description Extends authMiddleware by checking the 'systemuser' flag.
 * @usage Use this for critical routes like initial-funds or system audits.
 * @example Only an admin or the "Central Bank" user should pass this.
 */
const systemUserMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;
    if(!token)
    {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized access, token is missing"));
    
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Explicitly selecting "+systemuser" because it is hidden by default in the schema
        const user = await usermodel.findById(decoded.id).select("+systemuser");
        
        if(!user || !user.systemuser)
        {
            throw new ApiError(401, "Unauthorized access, system user privilege required");
        }
        
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
    
});

module.exports = { authMiddleware, systemUserMiddleware };
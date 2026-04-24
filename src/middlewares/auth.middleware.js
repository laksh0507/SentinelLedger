const usermodel = require("../models/user");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

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

const systemUserMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;
    if(!token)
    {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized access, token is missing"));
    
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await usermodel.findById(decoded.id).select("+systemuser");
        if(!user || !user.systemuser)
        {
            throw new ApiError(401,"Unauthorized access, system user is required");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
    
});

module.exports = { authMiddleware, systemUserMiddleware };
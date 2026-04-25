const ApiError = require("../utils/ApiError");

/**
 * Global Error Middleware
 * 
 * Logic:
 * 1. Catch any unhandled error or "ApiError" in the system.
 * 2. Format it into a clean JSON response (never crash the server).
 * 3. In development, provide the stack trace for debugging.
 */
const errorMiddleware = (err, req, res, next) => {
    let error = err;

    // If it's not a custom ApiError, normalize it
    if (!(error instanceof ApiError)) {
        let statusCode = error.statusCode || error.status || 500;
        
        // Handle specific Mongoose/MongoDB errors
        if (error.name === "ValidationError") statusCode = 400;
        if (error.name === "CastError") statusCode = 400; // Invalid ID format
        if (error.code === 11000) statusCode = 409;      // Duplicate key error

        const message = error.message || "Internal Server Error";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        success: false,
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        // Include stack trace only in development
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    };

    console.error(`🔥 ERROR [${error.statusCode}]: ${error.message}`);
    
    return res.status(error.statusCode).json(response);
};

module.exports = errorMiddleware;

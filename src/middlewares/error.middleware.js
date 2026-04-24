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
    let { statusCode, message } = err;

    // If it's not a custom ApiError, default to 500 (Internal Server Error)
    if (!(err instanceof ApiError)) {
        statusCode = 500;
        message = err.message || "Internal Server Error";
    }

    const response = {
        success: false,
        statusCode,
        message,
        // Pro-Tip: Hide stack trace in production for security!
        ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
    };

    return res.status(statusCode).json(response);
};

module.exports = errorMiddleware;

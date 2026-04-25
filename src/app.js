const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

const authRouter = require("./routes/auth");
const accountRouter = require("./routes/account");
const transactionroutes = require("./routes/transaction");
const errorMiddleware = require("./middlewares/error.middleware");

/**
 * Express Middleware Configuration
 * - cookieParser: Enables reading JWTs from secure browser cookies.
 * - express.json: Parses incoming JSON payloads (up to standard 16kb limit).
 */
app.use(cookieParser());
app.use(express.json());

/**
 * @section Routes
 * All routes are versioned implicitly within the /api prefix.
 */
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionroutes);

/**
 * @section Error Handling
 * Global Error Handler must be the final middleware.
 * It catches all 'throw new ApiError' calls from the controllers.
 */
app.use(errorMiddleware);

module.exports = app;
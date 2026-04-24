const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const accountRouter = require("./routes/account");
app.use(cookieParser());
app.use(express.json());

const authRouter = require("./routes/auth");
const errorMiddleware = require("./middlewares/error.middleware");

app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
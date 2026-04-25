const mongoose = require("mongoose");

/**
 * Blacklist Model
 * @description Stores invalidated JWT tokens (e.g., after logout).
 * Tokens in this list are rejected even if they haven't expired yet.
 */
const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "10d" // Automatically remove from DB after 10 days (matching JWT expiry)
    }
});

const Blacklist = mongoose.model("Blacklist", blacklistSchema);
module.exports = Blacklist;

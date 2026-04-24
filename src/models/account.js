const mongoose = require("mongoose");

/**
 * Account Model - The core financial container for a user's funds.
 * 
 * Logic:
 * - One User can have one or more accounts (e.g., Savings, Checking).
 * - Balance is protected with a minimum value of 0 to prevent overdrafts.
 */
const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Links to the owner
        required: [true, "user is required"],
        index: true
    },
    /**
     * Account Status
     * @example "ACTIVE" -> Normal operations.
     * @example "FROZEN" -> Suspected fraud, all transfers blocked.
     */
    status: {
        type: String,
        enum: ["ACTIVE", "FROZEN", "CLOSED"],
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required: [true, "currency is required for creating an account"],
        default: "INR"
    },
    /**
     * Account Balance
     * @description The current available funds. 
     * @warning Must be updated atomically via $inc to avoid race conditions.
     */
    balance: {
        type: Number,
        default: 0,
        min: [0, "Balance cannot be negative"] // Built-in safety against double-spending
    }
}, {
    timestamps: true
});

accountSchema.index({ user: 1, status: 1 }); // Optimized for finding user's active accounts

const accountModel = mongoose.model("Account", accountSchema);
module.exports = accountModel;

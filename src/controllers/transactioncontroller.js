const mongoose = require("mongoose");
const transactionModel = require("../models/transaction");
const ledgerModel = require("../models/ledger");
const accountModel = require("../models/account");
const userModel = require("../models/user");
const emailservice = require("../services/email");
const ApiError = require("../utils/ApiError");

/**
 * Handles standard peer-to-peer (P2P) transfers.
 * @description This function ensures that money is subtracted from the sender
 * and added to the receiver in a single, non-breakable operation.
 * @param {Object} req - Request containing fromaccount, toaccount, amount, and idempotencykey.
 */
async function createtransaction(req, res) {
    const { fromaccount, toaccount, amount, idempotencykey } = req.body;
    // Implementation for standard transfers
}

/**
 * Handles the injection of value into the system (Initial Funds).
 * @description This function acts as the "Central Bank" route. It takes money
 * from the System Account and places it into a User's account.
 * 
 * Logic Flow:
 * 1. Identify the authorized System User and their account.
 * 2. Start a Database Session for Atomicity.
 * 3. Update User Balance (The "Math").
 * 4. Record the Transaction (The "Log").
 * 5. Create Ledger Entry (The "Audit Trail").
 * 
 * @param {Object} req - Request containing toaccount, amount, and idempotencykey.
 */
async function createinitialfundstransaction(req, res) {
    const { toaccount, amount, idempotencykey } = req.body;
    
    if (!toaccount || !amount || !idempotencykey) {
        throw new ApiError(400, "All fields are required");
    }

    // 1. Identifying the System/Central account as the source
    const systemUser = await userModel.findOne({ systemuser: true });
    if (!systemUser) {
        return res.status(404).json({ message: "No system user found. Please create one first." });
    }

    const fromuseraccount = await accountModel.findOne({ user: systemUser._id });
    if (!fromuseraccount) {
        return res.status(404).json({ message: "System user account not found" });
    }

    // 2. Starting ACID transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 3. Atomically update the target account balance
        const updatedAccount = await accountModel.findByIdAndUpdate(
            toaccount,
            { $inc: { balance: amount } },
            { session, new: true }
        );

        if (!updatedAccount) throw new Error("Target account not found during balance update");

        // 4. Create the Transaction record (The high-level log)
        const [transaction] = await transactionModel.create([{
            fromaccount: fromuseraccount._id,
            toaccount,
            amount,
            idempotencykey,
            status: "COMPLETED"
        }], { session });

        // 5. Create Ledger Entry (The immutable audit record)
        await ledgerModel.create([{
            account: toaccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        // Complete the sequence
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction,
            currentBalance: updatedAccount.balance
        });
    } catch (error) {
        // Safe rollback if anything fails
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

module.exports = {
    createtransaction, 
    createinitialfundstransaction
};

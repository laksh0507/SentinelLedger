const mongoose = require("mongoose");
const transactionModel = require("../models/transaction");
const ledgerModel = require("../models/ledger");
const accountModel = require("../models/account");
const userModel = require("../models/user"); // Fixed: Added userModel import
const emailservice = require("../services/email");
const ApiError = require("../utils/ApiError");

async function createtransaction(req, res) {
    const { fromaccount, toaccount, amount, idempotencykey } = req.body;
    // Logic for standard transfers can be implementation here similar to the one below
}

async function createinitialfundstransaction(req, res) {
    const { toaccount, amount, idempotencykey } = req.body;
    
    if (!toaccount || !amount || !idempotencykey) {
        throw new ApiError(400, "All fields are required");
    }

    // Fixed: Search for System User first, then their Account
    const systemUser = await userModel.findOne({ systemuser: true });
    if (!systemUser) {
        return res.status(404).json({ message: "No system user found. Please create one first." });
    }

    const fromuseraccount = await accountModel.findOne({ user: systemUser._id });
    if (!fromuseraccount) {
        return res.status(404).json({ message: "System user account not found" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Update the actual Account balance (The missing math!)
        const updatedAccount = await accountModel.findByIdAndUpdate(
            toaccount,
            { $inc: { balance: amount } },
            { session, new: true }
        );

        if (!updatedAccount) throw new Error("Target account not found during balance update");

        // 2. Create the Transaction Record
        const [transaction] = await transactionModel.create([{
            fromaccount: fromuseraccount._id,
            toaccount,
            amount,
            idempotencykey,
            status: "COMPLETED" // Directly completed for initial funds
        }], { session });

        // 3. Create the Ledger Entry
        await ledgerModel.create([{
            account: toaccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction,
            currentBalance: updatedAccount.balance
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

module.exports = {
    createtransaction, 
    createinitialfundstransaction
};

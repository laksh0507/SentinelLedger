const mongoose = require("mongoose");
const transactionModel = require("../models/transaction");
const ledgerModel = require("../models/ledger");
const accountModel = require("../models/account");

const emailService = require("../services/email");
const ApiError = require("../utils/ApiError");

async function createtransaction(req, res) {
    const { fromaccount, toaccount, amount, idempotencykey } = req.body;
    if (!fromaccount || !toaccount || !amount || !idempotencykey) {
        return res.status(400).json({
            message: "all fields are required"
        })
    }

    const fromuseraccount = await accountModel.findById(fromaccount);
    const touseraccount = await accountModel.findById(toaccount).populate("user"); // Populate to get receiver's email
    if (!fromuseraccount || !touseraccount) {
        return res.status(404).json({
            message: "account not found"
        })
    }

    const istransactionalreadyexists = await transactionModel.findOne({ idempotencykey: idempotencykey });
    if (istransactionalreadyexists) {
        if (istransactionalreadyexists.status == "COMPLETED") {
            return res.status(400).json({
                message: "transaction already completed"
            })
        }
        if (istransactionalreadyexists.status == "FAILED") {
            return res.status(400).json({
                message: "transaction is failed"
            })
        }
        if (istransactionalreadyexists.status == "PENDING") {
            return res.status(400).json({
                message: "transaction is pending"
            })
        }
        if (istransactionalreadyexists.status == "REVERSED") {
            return res.status(400).json({
                message: "transaction is reversed"
            })
        }
    }

    if (fromuseraccount.status != "ACTIVE" || touseraccount.status != "ACTIVE") {
        return res.status(400).json({
            message: "account is not active"
        })
    }

    // 1. CHECK FOR INSUFFICIENT FUNDS (Critical for P2P!)
    if (fromuseraccount.balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Your current balance is ${fromuseraccount.balance}`
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. DEDUCT from sender
        await accountModel.findByIdAndUpdate(
            fromaccount,
            { $inc: { balance: -amount } },
            { session }
        );

        // 3. ADD to receiver
        const updatedReceiverAccount = await accountModel.findByIdAndUpdate(
            toaccount,
            { $inc: { balance: amount } },
            { session, new: true }
        );

        // 4. Record the Transaction
        const [transaction] = await transactionModel.create([{
            fromaccount: fromaccount,
            toaccount: toaccount,
            amount,
            idempotencykey: idempotencykey,
            status: "COMPLETED"
        }], { session });

        // 5. Create Double-Entry Ledger
        await ledgerModel.create([
            {
                account: fromaccount,
                amount: amount,
                transaction: transaction._id,
                type: "DEBIT"
            },
            {
                account: toaccount,
                amount: amount,
                transaction: transaction._id,
                type: "CREDIT"
            }
        ], { session });

        await session.commitTransaction();
        session.endSession();

        // 6. Notify Sender via Email (Non-blocking)
        emailService.sendtransactionemail(
            req.user.email,
            req.user.name,
            amount,
            toaccount
        ).catch(err => console.error("Sender Email failed:", err));

        // 7. Notify Receiver via Email (Non-blocking)
        if (touseraccount.user && touseraccount.user.email) {
            emailService.sendtransactionemail(
                touseraccount.user.email,
                touseraccount.user.name,
                amount,
                fromaccount
            ).catch(err => console.error("Receiver Email failed:", err));
        }

        return res.status(201).json({
            message: "Transfer successful",
            transactionId: transaction._id,
            amountSent: amount,
            remainingBalance: fromuseraccount.balance - amount
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            message: "Transaction failed",
            error: error.message
        });
    }
}

async function createinitialfundstransaction(req, res) {
    const { toaccount, amount, idempotencykey } = req.body;

    if (!toaccount || !amount || !idempotencykey) {
        throw new ApiError(400, "All fields are required");
    }

    // req.user is already the verified system user (set by systemUserMiddleware)
    const fromuseraccount = await accountModel.findOne({ user: req.user._id });
    if (!fromuseraccount) {
        return res.status(404).json({ message: "System user account not found" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Deduct from system account (Fix: system balance must go down)
        await accountModel.findByIdAndUpdate(
            fromuseraccount._id,
            { $inc: { balance: -amount } },
            { session }
        );

        // 2. Update the receiver's account balance (with populate for email)
        const updatedAccount = await accountModel.findByIdAndUpdate(
            toaccount,
            { $inc: { balance: amount } },
            { session, new: true }
        ).populate("user"); // Added populate here

        if (!updatedAccount) throw new Error("Target account not found during balance update");

        // 2. Create the Transaction Record
        const [transaction] = await transactionModel.create([{
            fromaccount: fromuseraccount._id,
            toaccount,
            amount,
            idempotencykey,
            status: "COMPLETED" // Directly completed for initial funds
        }], { session });

        // 3. Create Double-Entry Ledger (DEBIT system, CREDIT receiver)
        await ledgerModel.create([
            {
                account: fromuseraccount._id,
                amount: amount,
                transaction: transaction._id,
                type: "DEBIT"
            },
            {
                account: toaccount,
                amount: amount,
                transaction: transaction._id,
                type: "CREDIT"
            }
        ], { session });

        await session.commitTransaction();
        session.endSession();

        // 5. Notify Receiver via Email (Since it's initial funds, we notify the target)
        // Note: For this to work perfectly, we'd need to populate the receiver's user info.
        // Assuming req.user is the Admin, but the money went TO someone else.
        emailService.sendtransactionemail(
            req.user.email, // System user email
            req.user.name,
            amount,
            toaccount
        ).catch(err => console.error("Admin Email failed:", err));

        // 6. Notify Receiver of Initial Funds (Non-blocking)
        if (updatedAccount.user && updatedAccount.user.email) {
            emailService.sendtransactionemail(
                updatedAccount.user.email,
                updatedAccount.user.name,
                amount,
                "CENTRAL_BANK"
            ).catch(err => console.error("Receiver Email failed:", err));
        }

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

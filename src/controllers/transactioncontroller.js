const mongoose = require("mongoose");
const transactionModel = require("../models/transaction");
const ledgerModel = require("../models/ledger");
const accountModel = require("../models/account");
const emailService = require("../services/email");

/**
 * createtransaction - Integer-based Math (Paisa)
 */
async function createtransaction(req, res) {
    try {
        let { fromAccount, toAccount, amount, idempotencyKey } = req.body;

        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // FLAW #3 FIX: Convert to Integer (Paise)
        const amountInPaise = Math.round(amount * 100);
        if (amountInPaise <= 0) {
            return res.status(400).json({ message: "Amount must be positive" });
        }

        // Idempotency Check
        const exists = await transactionModel.findOne({ idempotencyKey });
        if (exists) {
            if (exists.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: exists,
                    isDuplicate: true
                });
            }
            return res.status(400).json({ message: `Transaction is currently ${exists.status}` });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Lock accounts and verify status inside session
            const fromAcc = await accountModel.findById(fromAccount).session(session);
            const toAcc = await accountModel.findById(toAccount).session(session).populate("user");

            if (!fromAcc || !toAcc) throw new Error("Account not found");

            if (fromAcc.status !== "ACTIVE" || toAcc.status !== "ACTIVE") {
                throw new Error("One or both accounts are not active");
            }

            // SECURITY FIX: Verify ownership of the source account
            if (fromAcc.user.toString() !== req.user._id.toString()) {
                throw new Error("Unauthorized: You do not own the source account");
            }

            // Balance check (Comparing Paise with Paise)
            if (fromAcc.balance < amountInPaise) {
                throw new Error("Insufficient funds");
            }

            // Deadlock Prevention: Sorted IDs
            const sortedIds = [fromAccount, toAccount].sort();
            for (const id of sortedIds) {
                const isFrom = id.toString() === fromAccount.toString();
                const change = isFrom ? -amountInPaise : amountInPaise;
                await accountModel.findByIdAndUpdate(id, { $inc: { balance: change } }, { session });
            }

            // Record transaction (Storing as Paise)
            const [transaction] = await transactionModel.create([{
                fromAccount,
                toAccount,
                amount: amountInPaise,
                idempotencyKey,
                status: "COMPLETED"
            }], { session });

            // Double-Entry Ledger (Storing as Paise)
            await ledgerModel.create([
                { account: fromAccount, amount: amountInPaise, transaction: transaction._id, type: "DEBIT" },
                { account: toAccount, amount: amountInPaise, transaction: transaction._id, type: "CREDIT" }
            ], { session, ordered: true });

            await session.commitTransaction();
            session.endSession();

            // Notify
            emailService.sendtransactionemail(req.user.email, req.user.name, amount, toAccount).catch(() => {});

            return res.status(201).json({
                message: "Transfer successful",
                transactionId: transaction._id,
                amountSent: amount,
                remainingBalance: (fromAcc.balance - amountInPaise) / 100 // Convert back for display
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: error.message });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * createinitialfundstransaction - Integer-based Math (Paisa)
 */
async function createinitialfundstransaction(req, res) {
    try {
        const { toAccount, amount, idempotencyKey } = req.body;
        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const amountInPaise = Math.round(amount * 100);

        const fromuseraccount = await accountModel.findOne({ user: req.user._id });
        if (!fromuseraccount) return res.status(404).json({ message: "System account missing" });

        const exists = await transactionModel.findOne({ idempotencyKey });
        if (exists) return res.status(200).json({ message: "Success (Duplicate)", transaction: exists });

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const targetAcc = await accountModel.findById(toAccount).session(session).populate("user");
            if (!targetAcc || targetAcc.status !== "ACTIVE") throw new Error("Target account inactive");

            await accountModel.findByIdAndUpdate(fromuseraccount._id, { $inc: { balance: -amountInPaise } }, { session });
            await accountModel.findByIdAndUpdate(toAccount, { $inc: { balance: amountInPaise } }, { session });

            const [transaction] = await transactionModel.create([{
                fromAccount: fromuseraccount._id,
                toAccount,
                amount: amountInPaise,
                idempotencyKey,
                status: "COMPLETED"
            }], { session });

            await ledgerModel.create([
                { account: fromuseraccount._id, amount: amountInPaise, transaction: transaction._id, type: "DEBIT" },
                { account: toAccount, amount: amountInPaise, transaction: transaction._id, type: "CREDIT" }
            ], { session, ordered: true });

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({ 
                message: "Funds injected", 
                currentBalance: (targetAcc.balance + amountInPaise) / 100 
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: error.message });
        }
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = { createtransaction, createinitialfundstransaction };

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

/**
 * createtransaction - Integer-based Math (Paisa)
 */
const createtransaction = asyncHandler(async (req, res) => {
    let { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "All fields (fromAccount, toAccount, amount, idempotencyKey) are required");
    }

    // Convert to Integer (Paise)
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise <= 0) {
        throw new ApiError(400, "Amount must be a positive number");
    }

    // Idempotency Check
    const exists = await transactionModel.findOne({ idempotencyKey });
    if (exists) {
        if (exists.status === "COMPLETED") {
            return res.status(200).json(new ApiResponse(200, {
                transaction: exists,
                isDuplicate: true
            }, "Transaction already processed"));
        }
        throw new ApiError(400, `Transaction is currently ${exists.status}`);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Lock accounts and verify status inside session
        const fromAcc = await accountModel.findById(fromAccount).session(session);
        const toAcc = await accountModel.findById(toAccount).session(session).populate("user");

        if (!fromAcc || !toAcc) {
            throw new ApiError(404, "One or both accounts not found");
        }

        if (fromAcc.status !== "ACTIVE" || toAcc.status !== "ACTIVE") {
            throw new ApiError(400, "One or both accounts are not ACTIVE");
        }

        // SECURITY: Verify ownership of the source account
        if (fromAcc.user.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Unauthorized: You do not own the source account");
        }

        // Balance check (Comparing Paise with Paise)
        if (fromAcc.balance < amountInPaise) {
            throw new ApiError(400, "Insufficient funds in the source account");
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

        return res.status(201).json(new ApiResponse(201, {
            transactionId: transaction._id,
            amountSent: amount,
            remainingBalance: (fromAcc.balance - amountInPaise) / 100
        }, "Transfer successful"));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        // Propagate the error so the global middleware catches it
        throw error;
    }
});

/**
 * createinitialfundstransaction - Integer-based Math (Paisa)
 */
const createinitialfundstransaction = asyncHandler(async (req, res) => {
    const { toAccount, amount, idempotencyKey } = req.body;
    if (!toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "All fields (toAccount, amount, idempotencyKey) are required");
    }

    const amountInPaise = Math.round(amount * 100);

    const fromuseraccount = await accountModel.findOne({ user: req.user._id });
    if (!fromuseraccount) {
        throw new ApiError(404, "System/Source account missing for this user");
    }

    const exists = await transactionModel.findOne({ idempotencyKey });
    if (exists) {
        return res.status(200).json(new ApiResponse(200, { transaction: exists }, "Success (Duplicate)"));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const targetAcc = await accountModel.findById(toAccount).session(session).populate("user");
        if (!targetAcc || targetAcc.status !== "ACTIVE") {
            throw new ApiError(400, "Target account not found or inactive");
        }

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

        return res.status(201).json(new ApiResponse(201, {
            currentBalance: (targetAcc.balance + amountInPaise) / 100
        }, "Funds injected successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

module.exports = { createtransaction, createinitialfundstransaction };

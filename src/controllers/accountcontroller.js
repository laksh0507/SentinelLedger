const accountmodel = require("../models/account");
const ledgermodel = require("../models/ledger");
const transactionModel = require("../models/transaction");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

/**
 * createaccount - Opens a new account
 */
const createaccount = asyncHandler(async (req, res) => {
    const { currency } = req.body;
    const userId = req.user._id;

    const existingAccount = await accountmodel.findOne({ user: userId, status: "ACTIVE" });
    if (existingAccount) {
        throw new ApiError(400, "User already has an active account");
    }

    const account = await accountmodel.create({
        user: userId,
        currency: currency || "INR",
        balance: 0 // Stored as Paise (Integer)
    });

    return res.status(201).json(new ApiResponse(201, account, "Account created successfully"));
});

/**
 * getallaccounts - Fetches all accounts (Converts Paise to Main Currency)
 */
const getallaccounts = asyncHandler(async (req, res) => {
    const user = req.user._id;
    const accountsFiltered = await accountmodel.find({ user: user });
    
    // Convert Paise to Decimal for the User
    const accounts = accountsFiltered.map(acc => ({
        ...acc._doc,
        balance: acc.balance / 100
    }));

    if (accounts.length === 0) {
        return res.status(200).json(new ApiResponse(200, { accounts: [], count: 0 }, "No accounts found. Kindly open one!"));
    }

    return res.status(200).json(new ApiResponse(200, {
        accounts: accounts,
        count: accounts.length
    }, "All accounts fetched successfully"));
});

/**
 * getclosedaccounts - Fetches closed accounts
 */
const getclosedaccounts = asyncHandler(async (req, res) => {
    const user = req.user._id;
    const closedAccountsRaw = await accountmodel.find({ user: user, status: "CLOSED" });

    const accounts = closedAccountsRaw.map(acc => ({
        ...acc._doc,
        balance: acc.balance / 100
    }));

    return res.status(200).json(new ApiResponse(200, {
        accounts: accounts,
        count: accounts.length
    }, "Closed accounts fetched successfully"));
});

/**
 * getbalance - Get balance (Converts Paise to Main Currency)
 */
const getbalance = asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    
    const account = await accountmodel.findOne({
        _id: accountId,
        user: req.user._id
    });

    if (!account) {
        throw new ApiError(404, "Account not found or access denied");
    }

    return res.status(200).json(new ApiResponse(200, {
        balance: account.balance / 100, // Conversion
        currency: account.currency,
        status: account.status
    }, "Balance fetched successfully"));
});

/**
 * closeaccount - Safe closure with balance and pending check
 */
const closeaccount = asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const account = await accountmodel.findOne({ _id: accountId, user: req.user._id });

    if (!account) {
        throw new ApiError(404, "Account not found");
    }
    
    if (account.status === "CLOSED") {
        return res.status(200).json(new ApiResponse(200, {}, "Account is already closed."));
    }

    if (account.balance !== 0) {
        throw new ApiError(400, `You have ${account.balance / 100} remaining. Please empty the account before closing.`);
    }

    const pendingTransaction = await transactionModel.findOne({
        $or: [{ fromAccount: accountId }, { toAccount: accountId }],
        status: "PENDING"
    });

    if (pendingTransaction) {
        throw new ApiError(400, "Pending transactions detected. Please complete or cancel them before closing.");
    }

    account.status = "CLOSED";
    await account.save();

    return res.status(200).json(new ApiResponse(200, {}, "Account closed successfully."));
});

/**
 * getstatement - Fetches history (Converts Paise to Main Currency)
 */
const getstatement = asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const account = await accountmodel.findOne({ _id: accountId, user: req.user._id });

    if (!account) {
        throw new ApiError(403, "Access denied: Account not found or unauthorized");
    }

    const statementRaw = await ledgermodel.find({ account: accountId })
        .sort({ createdAt: -1 })
        .limit(10);

    // Convert Integer amounts back to Decimals for display
    const statement = statementRaw.map(entry => ({
        ...entry._doc,
        amount: entry.amount / 100
    }));

    return res.status(200).json(new ApiResponse(200, {
        statement: statement,
        count: statement.length
    }, account.status === "CLOSED" ? "History for closed account fetched" : "Statement fetched successfully"));
});

/**
 * deleteaccount - Permanent removal
 */
const deleteaccount = asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const account = await accountmodel.findOne({ _id: accountId, user: req.user._id });

    if (!account) {
        throw new ApiError(404, "Account not found");
    }
    
    if (account.status !== "CLOSED") {
        throw new ApiError(400, "Account must be CLOSED before it can be deleted.");
    }

    await accountmodel.findByIdAndDelete(accountId);
    return res.status(200).json(new ApiResponse(200, {}, "Account record deleted permanently."));
});

module.exports = { 
    createaccount, 
    getallaccounts, 
    getclosedaccounts, 
    getbalance, 
    closeaccount, 
    getstatement,
    deleteaccount
};
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
    try {
        const user = req.user._id;
        const accountsFiltered = await accountmodel.find({ user: user });
        
        // Convert Paise to Decimal for the User
        const accounts = accountsFiltered.map(acc => ({
            ...acc._doc,
            balance: acc.balance / 100
        }));

        if (accounts.length === 0) {
            return res.status(200).json({ message: "You have zero accounts. Kindly open one!" });
        }

        return res.status(200).json({
            message: "All accounts fetched successfully",
            accounts: accounts,
            count: accounts.length
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * getclosedaccounts - Fetches closed accounts
 */
const getclosedaccounts = asyncHandler(async (req, res) => {
    try {
        const user = req.user._id;
        const closedAccountsRaw = await accountmodel.find({ user: user, status: "CLOSED" });

        const accounts = closedAccountsRaw.map(acc => ({
            ...acc._doc,
            balance: acc.balance / 100
        }));

        return res.status(200).json({
            message: "Closed accounts fetched successfully",
            accounts: accounts,
            count: accounts.length
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching closed accounts" });
    }
});

/**
 * getbalance - Get balance (Converts Paise to Main Currency)
 */
const getbalance = asyncHandler(async (req, res) => {
    try {
        const { accountid } = req.params;
        const account = await accountmodel.findOne({
            _id: accountid,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found or access denied" });
        }

        return res.status(200).json({
            balance: account.balance / 100, // Conversion
            currency: account.currency,
            status: account.status
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal error" });
    }
});

/**
 * closeaccount - Safe closure with balance and pending check
 */
const closeaccount = asyncHandler(async (req, res) => {
    try {
        const { accountid } = req.params;
        const account = await accountmodel.findOne({ _id: accountid, user: req.user._id });

        if (!account) return res.status(404).json({ message: "Account not found" });
        if (account.status === "CLOSED") return res.status(200).json({ message: "Already closed." });

        if (account.balance !== 0) {
            return res.status(400).json({
                message: `You have ${account.balance / 100} left! Please empty the account first.`
            });
        }

        const pendingTransaction = await transactionModel.findOne({
            $or: [{ fromaccount: accountid }, { toaccount: accountid }],
            status: "PENDING"
        });

        if (pendingTransaction) {
            return res.status(400).json({ message: "Pending transactions detected. Please wait." });
        }

        account.status = "CLOSED";
        await account.save();

        return res.status(200).json({ message: "Account closed successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
});

/**
 * getstatement - Fetches history (Converts Paise to Main Currency)
 */
const getstatement = asyncHandler(async (req, res) => {
    try {
        const { accountid } = req.params;
        const account = await accountmodel.findOne({ _id: accountid, user: req.user._id });

        if (!account) return res.status(404).json({ message: "Access denied" });

        const statementRaw = await ledgermodel.find({ account: accountid })
            .sort({ createdAt: -1 })
            .limit(10);

        // Convert Integer amounts back to Decimals for display
        const statement = statementRaw.map(entry => ({
            ...entry._doc,
            amount: entry.amount / 100
        }));

        return res.status(200).json({
            message: account.status === "CLOSED" ? "History for closed account" : "Statement fetched",
            statement: statement,
            count: statement.length
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching statement" });
    }
});

/**
 * deleteaccount - Permanent removal
 */
const deleteaccount = asyncHandler(async (req, res) => {
    try {
        const { accountid } = req.params;
        const account = await accountmodel.findOne({ _id: accountid, user: req.user._id });

        if (!account) return res.status(404).json({ message: "Not found" });
        if (account.status !== "CLOSED") {
            return res.status(400).json({ message: "Must close account before deleting record." });
        }

        await accountmodel.findByIdAndDelete(accountid);
        return res.status(200).json({ message: "Account record deleted permanently." });
    } catch (error) {
        return res.status(500).json({ message: "Internal error" });
    }
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
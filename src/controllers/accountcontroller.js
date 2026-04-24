const accountmodel = require("../models/account");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const ledgermodel=require("../models/ledger");

/**
 * @controller AccountController
 * @description Manages the user's financial containers.
 * @usage Users can call this to open their first account after registration.
 */

const createaccount = asyncHandler(async (req, res) => {
    const { currency } = req.body;
    const userId = req.user._id;

    // SDE-2 Pattern: Prevent a user from creating multiple accounts for now (or implement logic for it)
    const existingAccount = await accountmodel.findOne({ user: userId });
    if (existingAccount) {
        throw new ApiError(400, "User already has an active account");
    }

    const account = await accountmodel.create({
        user: userId,
        currency: currency || "INR",
        balance: 0 // Initializing with zero. Initial funds must come from the system API.
    });

    return res.status(201).json(new ApiResponse(201, account, "Account created successfully"));
});


const getbalance = asyncHandler(async(req, res)=> {
    try{
        
        const {accountid}=req.params;
        const account = await accountmodel.findOne(
            {
                _id:accountid,
                user:req.user._id
            }
        );

        if(!account)
        {
            return res.status(404).json({
                message:"account not found or access denied"
            });
        }

        return res.status(200).json({balance:account.balance,currency:account.currency})

    }
    catch (error) {
        return res.status(500).json({ 
            message: "Internal server error occurred",
            error: error.message 
        });
    }
});

const getstatement= asyncHandler(async(req,res)=>{
    try{
        const {accountid}=req.params;
        const list=await accountmodel.findOne({
            _id:accountid,
            user:req.user._id
        });

        if(!list)
        {
            return res.status(404).json({
                message:"account not found or access denied"
            });
        }

        const statement=await ledgermodel.find({
            account:accountid
        }).sort({createdAt:-1})
        .limit(10);

        return res.status(200).json({
            message:"statement fetched successfully",
            statement:statement
        })
    }
    catch(error)
    { 
        return res.status(500).json({ message: "Error fetching statement" });
    }
})

module.exports = { createaccount, getbalance , getstatement };
const mongoose = require("mongoose");

/**
 * Ledger Model - The Immutable Source of Truth.
 * 
 * Rules:
 * 1. Double-Entry: Every Debit must have a matching Credit (across the system).
 * 2. Immutability: Once a ledger entry is created, it can NEVER be edited or deleted.
 * 
 * @description The ledger is an audit trail. If the account balance is ever 
 * questioned, we sum the ledger entries to verify the truth.
 */
const ledgerschema= new mongoose.Schema({
    
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true,"ledger must be associated with an account"],
        index: true,
        immutable: true
    },
    
    amount:{
        type:Number,
        required:[true, "amount is required for creating a ledger"],
        index: true,
        immutable: true
    },
    
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required:[true,"ledger must be associated with a transaction"],
        index: true,
        immutable: true
    },
    
    /**
     * Entry Type
     * @example "DEBIT" -> Money leaving (-).
     * @example "CREDIT" -> Money entering (+).
     */
    type:{
        type:String,
        enum:{
            values:["DEBIT","CREDIT"],
            message:"type can either be DEBIT or CREDIT"
        },
        required:[true,"type is required for creating a ledger"],
        immutable: true
    }
})

// Sentinel Safety: Prevents ANY modification of financial history.
function preventledgermodification(){
    throw new Error("ledger entries are immutable and cannot be modified. Create a reversal transaction instead.")
}

ledgerschema.pre('findOneAndUpdate',preventledgermodification);
ledgerschema.pre('updateOne',preventledgermodification);
ledgerschema.pre('updateMany',preventledgermodification);
ledgerschema.pre('deleteMany',preventledgermodification);
ledgerschema.pre('deleteOne',preventledgermodification);
ledgerschema.pre('remove',preventledgermodification);
ledgerschema.pre('findOneAndDelete',preventledgermodification)
ledgerschema.pre('findOneAndReplace',preventledgermodification)

const ledgerModel = mongoose.model("Ledger",ledgerschema);
module.exports = ledgerModel;
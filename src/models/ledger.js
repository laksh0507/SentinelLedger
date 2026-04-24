const mongoose = require("mongoose");

const ledgerschema= new mongoose.Schema({
    
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "account",
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
        ref: "transaction",
        required:[true,"ledger must be associated with a transaction"],
        index: true,
        immutable: true
    },
    
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

function preventledgermodification(){
    throw new Error("ledger entried are immutable and cannot be modified")
}

ledgerschema.pre('findOneAndUpdate',preventledgermodification);
ledgerschema.pre('updateOne',preventledgermodification);
ledgerschema.pre('updateMany',preventledgermodification);
ledgerschema.pre('deleteMany',preventledgermodification);
ledgerschema.pre('deleteOne',preventledgermodification);
ledgerschema.pre('remove',preventledgermodification);
ledgerschema.pre('findOneAndDelete',preventledgermodification)
ledgerschema.pre('findOneAndReplace',preventledgermodification)


const ledgerModel = mongoose.model("ledger",ledgerschema);

module.exports = ledgerModel;
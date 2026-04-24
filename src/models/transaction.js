const mongoose = require("mongoose");

const transactionschema = new mongoose.Schema({
    
    fromaccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"transaction must be associated with a from account"],
        index:true
    },
    
    toaccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"transaction must be associated with a to account"],
        index:true
    },
    
    status:{
        type:String,
        enum:{
            values:["PENDING","COMPLETED","FAILED","REVERSED"],
            message:"status can either be PENDING,COMPLETED,FAILED,REVERSED"
        },
        default:"PENDING"
    },
    
    amount:{
        type:Number,
        required:[true,"amount is required for creating a transaction"],
        min: [0, "Transaction amount cannot be negative"]
    },
    
    idempotencykey:{
        type:String,
        required:[true,"idempotency key is required for creating a transaction"],
        unique:true,
        index:true
    },
},
    {
        timestamps:true
}) 

const transactionModel = mongoose.model("Transaction",transactionschema);
module.exports = transactionModel;
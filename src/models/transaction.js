const mongoose = require("mongoose");

/**
 * Transaction Model - High-level intent of a money movement.
 * 
 * Reliability Features:
 * - Idempotency Keys: Ensures a single request is never processed twice.
 * - Status Lifecycle: Tracks a transaction from PENDING to COMPLETED or FAILED.
 */
const transactionschema = new mongoose.Schema({
    
    fromaccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true,"transaction must be associated with a from account"],
        index:true
    },
    
    toaccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
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
    
    /**
     * idempotencykey
     * @description A unique string that identifies this specific intent.
     * @example "order_550e8400-e29b-41d4-a716-446655440000"
     * @usage If the client retries a failed request, the server uses this key
     * to detect the retry and avoid deducting money a second time.
     */
    idempotencykey:{
        type:String,
        required:[true,"idempotency key is required for creating a transaction"],
        unique:true, // Prevents duplicates at the DB level
        index:true
    },
},
    {
        timestamps:true
    }
) 

const transactionModel = mongoose.model("Transaction",transactionschema);
module.exports = transactionModel;
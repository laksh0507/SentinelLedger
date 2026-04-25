const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");

/**
 * User Model - Represents a Human or System entity in the banking ecosystem.
 * 
 * Features:
 * - Automatic password hashing via pre-save hook.
 * - Selective field hiding (Password/System status) for security.
 */
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: [true, "Email already exists"],
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"]
    },
    password: {
        type: String,
        required: [true, "password is required for creating account"],
        minlength: [6, "password must be atleast 6 characters long"],
        maxlength: [12, "password must be less than 12 characters long"],
        select: false // Hidden by default to prevent accidental leak in API responses
    },
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    /**
     * systemUser flag
     * @description Identifies internal system accounts used for seeding liquidity.
     * @example true -> Use this for the "Central Bank" account.
     * @example false -> Standard retail customer.
     */
    systemUser: {
        type: Boolean,
        default: false,
        select: false
    }
},
    {
        timestamps: true // Tracks createdAt and updatedAt for auditing
    }
)

// Hashing logic: Ensures passwords are never stored in plain text.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
})

// Authentication helper: Compares provided password with the hashed version in DB.
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
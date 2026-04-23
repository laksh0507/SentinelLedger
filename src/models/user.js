const mongoose = require("mongoose")
const bcrypt= require("bcryptjs");

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        trim:true,
        unique:[true,"Email already exists"],
        lowercase:true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"]
    },
    password:{
        type:String,
        required:[true,"password is required for creating account"],
        minlength:[6,"password must be atleast 6 characters long"],
        maxlength:[12,"password must be less than 12 characters long"],
        select:false
    },
    name:{
        type:String,
        required:[true,"Name is required"]
    }
},
    {
        timestamps:true
    }
)

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password);
}

const userModel=mongoose.model("User",userSchema);
module.exports=userModel;
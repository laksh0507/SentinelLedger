const express=require("express");
const {authMiddleware}=require("../middlewares/auth.middleware");
const accountcontroller=require("../controllers/accountcontroller");



const router=express.Router();

router.post("/",authMiddleware,accountcontroller.createAccount);



module.exports=router;
const usermodel = require("../models/user");
const jwt = require("jsonwebtoken");

async function registerUser(req, res) {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const isUserExist = await usermodel.findOne({ email });
        if (isUserExist) {
            return res.status(422).json({
                success: false,
                message: "User already exists"
            });
        }

        const user = await usermodel.create({
            email,
            password,
            name
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.cookie("token", token);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = { registerUser };

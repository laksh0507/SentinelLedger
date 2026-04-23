const mongoose = require("mongoose");

async function connecttodb() {
    console.log("Attempting to connect to MongoDB...");
    return mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Success! Server is connected to MongoDB");
    })
    .catch((error) => {
        console.error("❌ Database connection error details:");
        console.error("Message:", error.message);
        throw error; // Pass the error up so server.js can see it
    });
}

module.exports = connecttodb;
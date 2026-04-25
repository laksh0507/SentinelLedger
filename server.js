require("dotenv").config();
const app = require("./src/app");
const connecttodb = require("./src/config/db");

// Start the database first, then start the server
connecttodb().then(() => {
    const port = process.env.PORT || 4444;
    app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
    });
}).catch(err => {
    console.error("❌ Failed to start server: Database connection failed.");
});
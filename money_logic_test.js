require("dotenv").config();
const BASE_URL = "http://localhost:3000/api";
const mongoose = require("mongoose");
const path = require("path");

// We need the model to promote the user for the test
const userModelPath = path.join(__dirname, "src", "models", "user.js");
const UserModel = require(userModelPath);

async function testMoneyFlow() {
    console.log("💰 Starting Money Logic & Security Audit...");

    // Connect to DB for the "Admin Promotion" step
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bank_db");

    try {
        // --- 1. SETUP TWO USERS ---
        const userA = await setupUser("Alice");
        const userB = await setupUser("Bob");
        console.log("✅ Users & Accounts Prepared");

        // --- MANUALLY PROMOTE ALICE TO SYSTEM USER & SEED LIQUIDITY ---
        // We give the System User 1,000,000 Paise ($10,000) so they can distribute funds.
        await UserModel.findByIdAndUpdate(userA.rawUserId, { 
            systemUser: true 
        });
        await mongoose.connection.collection('accounts').updateOne(
            { _id: new mongoose.Types.ObjectId(userA.accountId) },
            { $set: { balance: 1000000 } }
        );
        console.log("✅ Alice Promoted & Liquidity Seeded");

        // --- 2. SYSTEM INJECTION (Admin Flow) ---
        // Pluralized /transactions/ and camelCase fields
        const injectRes = await fetch(`${BASE_URL}/transactions/system/initial-funds`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cookie": userA.cookie },
            body: JSON.stringify({
                toAccount: userA.accountId,
                amount: 100, 
                idempotencyKey: `system_${Date.now()}`
            })
        });
        const injectData = await injectRes.json();
        if (injectRes.status !== 201) throw new Error(`Injection failed: ${JSON.stringify(injectData)}`);
        console.log(`✅ System Injection: PASSED (New Balance: ${injectData.currentBalance})`);

        // --- 3. P2P TRANSFER (The Big Test) ---
        // Endpoint changed to /transactions/ (plural) and base path
        const transferRes = await fetch(`${BASE_URL}/transactions/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cookie": userA.cookie },
            body: JSON.stringify({
                fromAccount: userA.accountId,
                toAccount: userB.accountId,
                amount: 50.25,
                idempotencyKey: `transfer_${Date.now()}`
            })
        });
        const transferData = await transferRes.json();
        if (transferRes.status !== 201) throw new Error(`Transfer failed: ${JSON.stringify(transferData)}`);
        console.log(`✅ P2P Transfer: PASSED (Sender Balance: ${transferData.remainingBalance})`);

        // --- 4. SAFETY CHECK: CLOSURE LOCK ---
        // Pluralized /accounts/
        const closeRes = await fetch(`${BASE_URL}/accounts/close/${userB.accountId}`, {
            method: "PATCH",
            headers: { "Cookie": userB.cookie }
        });
        const closeData = await closeRes.json();
        if (closeRes.status === 400) {
            console.log("✅ Closure Safety Lock: PASSED (Blocked as expected)");
        } else {
            throw new Error(`Safety Failure: Account with money was allowed to close! Status: ${closeRes.status}, Data: ${JSON.stringify(closeData)}`);
        }

        console.log("\n🎊 MONEY LOGIC IS ROCK SOLID! 🎊");

    } catch (error) {
        console.error("\n❌ AUDIT FAILED:");
        console.error(error.message);
    } finally {
        await mongoose.disconnect();
    }
}

async function setupUser(name) {
    const email = `${name.toLowerCase()}${Date.now()}@test.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: "password123" })
    });
    const regData = await regRes.json();
    const cookie = regRes.headers.get("set-cookie");
    
    // Pluralized /accounts/
    const accRes = await fetch(`${BASE_URL}/accounts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": cookie },
        body: JSON.stringify({ currency: "INR" })
    });
    const accData = await accRes.json();
    
    if (!accData.data || !accData.data._id) {
        throw new Error(`Account creation failed for ${name}: ${JSON.stringify(accData)}`);
    }

    return { cookie, accountId: accData.data._id, rawUserId: regData.data.user._id };
}

testMoneyFlow();

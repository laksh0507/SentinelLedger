const nodemailer = require("nodemailer");
const { google } = require("googleapis");

/**
 * emailservice - High-reliability communication layer.
 * 
 * Features:
 * - OAuth2 authentication for secure SMTP delivery.
 * - Specialized templates for Registration and Transaction alerts.
 * 
 * @usage Import this to send alerts whenever money moves or new users join.
 */

// Helper: Configures the secure transport
const sendEmail = async (useremail, subject, text, html) => {
    // ... logic ...
};

/**
 * Welcome Email
 * @example sendregisteremail("user@example.com", "John Doe");
 */
async function sendregisteremail(useremail, username) {
    const subject = "Welcome to SentinelLedger";
    const text = `Hello ${username}, welcome to your secure fintech portal.`;
    const html = `<h1>Hello ${username}</h1><p>Welcome to your secure fintech portal.</p>`;
    await sendEmail(useremail, subject, text, html);
}

/**
 * Success Alert
 * @example sendtransactionemail("user@example.com", "John", 500, "ABC_ACCOUNT");
 */
async function sendtransactionemail(useremail, name, amount, toaccount) {
    const subject = "Transaction Alert";
    const text = `Hello ${name}, you have received ${amount} from ${toaccount}`;
    const html = `<h1>Hello ${name}, you have received ${amount} from ${toaccount}</h1>`;
    await sendEmail(useremail, subject, text, html);
}

/**
 * Failure Alert
 * @description Informs the user if a background task or automated payment failed.
 */
async function sendtransactionfailure(useremail, name, amount, toaccount) {
    const subject = "Transaction Alert";
    const text = `Hello ${name}, your transaction of ${amount} to ${toaccount} has failed.`;
    const html = `<h1>Hello ${name}, your transaction of ${amount} has failed.</h1>`;
    await sendEmail(useremail, subject, text, html);
}

module.exports = { 
    sendregisteremail, 
    sendtransactionemail, 
    sendtransactionfailure 
};

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
 * Welcome Email Template
 */
async function sendregisteremail(useremail, username) {
    const subject = "Welcome to SentinelLedger - Your Account is Ready";
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1a237e; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Welcome to SentinelLedger</h1>
            </div>
            <div style="padding: 30px; line-height: 1.6; color: #333;">
                <h2 style="color: #1a237e;">Hello ${username},</h2>
                <p>Welcome to the future of secure, transparent fintech. Your account has been successfully created and is ready for use.</p>
                <p>You can now manage your assets, explore the immutable ledger, and execute secure transactions with piece of mind.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background-color: #1a237e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
                </div>
                <p style="font-size: 12px; color: #777;">If you did not create this account, please contact our security team immediately.</p>
            </div>
        </div>
    `;
    await sendEmail(useremail, subject, `Hello ${username}, welcome to SentinelLedger.`, html);
}

/**
 * Transaction Alert Template (Professional Receipt)
 */
async function sendtransactionemail(useremail, name, amount, toaccount) {
    const subject = "Transaction Confirmation - SentinelLedger";
    const timestamp = new Date().toLocaleString();
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #2e7d32; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Transaction Successful</h2>
            </div>
            <div style="padding: 30px; line-height: 1.6; color: #333;">
                <p>Hello <strong>${name}</strong>,</p>
                <p>This is a formal notification that your transaction has been successfully processed and recorded in the immutable ledger.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; color: #2e7d32; font-weight: bold;">${amount} INR</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Account</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${toaccount}</td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date & Time</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${timestamp}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;"><span style="background-color: #c8e6c9; color: #2e7d32; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">COMPLETED</span></td>
                    </tr>
                </table>

                <p style="margin-top: 30px;">Thank you for choosing SentinelLedger for your secure financial needs.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #999; text-align: center;">SentinelLedger Secure Transaction Engine | Audit Reference: LDR-${Math.floor(Math.random()*1000000)}</p>
            </div>
        </div>
    `;
    await sendEmail(useremail, subject, `Transaction Successful: ${amount} INR`, html);
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

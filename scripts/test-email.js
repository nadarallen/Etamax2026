/**
 * Script to test Email configuration (Nodemailer) by sending a self-email.
 */
const dotenv = require('dotenv');
// Try to load from .env in the parent directory
dotenv.config({ path: require('path').resolve(__dirname, '../.env.local') });
const nodemailer = require('nodemailer');

async function main() {
    console.log("Testing Email Configuration...");
    console.log("User:", process.env.EMAIL_USER);
    // console.log("Pass:", process.env.EMAIL_PASS ? "****" : "MISSING");

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("ERROR: EMAIL_USER or EMAIL_PASS is missing in .env.local");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: "etamax2026@gmail.com", // Specific test recipient
            subject: "Test Email from Etamax Debugger",
            text: "If you are reading this, the email configuration is working! Sent to etamax2026.",
        });

        console.log("✅ Email sent successfully!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Failed to send email.");
        console.error("Error Message:", error.message);
        console.error("Error Code:", error.code);

        if (error.code === 'EAUTH') {
            console.log("\n--- DIAGNOSIS: AUTHENTICATION FAILED ---");
            console.log("1. You are likely using your Login Password instead of an App Password.");
            console.log("2. Gmail blocks regular passwords for security.");
            console.log("3. SOLUTION: Go to https://myaccount.google.com/apppasswords");
            console.log("   - Select 'Mail' and 'Windows Computer'");
            console.log("   - Generate a password");
            console.log("   - Update .env.local with the 16-character code (remove spaces).");
        }
    }
}

main();

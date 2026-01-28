import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load env variables from .env.local
dotenv.config({ path: '.env.local' });

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/\s+/g, ''), // Strip spaces for safety
    },
});

async function sendTestMail() {
    console.log("Using User:", process.env.EMAIL_USER);
    // console.log("Using Pass:", process.env.EMAIL_PASS); // Security risk, keep commented

    try {
        await transporter.sendMail({
            from: `"ETAMAX 2026" <${process.env.EMAIL_USER}>`,
            to: "abhishekkulbainur@gmail.com", // Updated to your likely email or a safe test one
            subject: "ETAMAX Test Email",
            text: "If you got this mail, Nodemailer is working ✅",
        });

        console.log("✅ Mail sent successfully");
    } catch (error) {
        console.error("❌ Mail failed:", error);
    }
}

// CALL THE FUNCTION
sendTestMail();

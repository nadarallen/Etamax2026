import nodemailer from 'nodemailer';

// Create a reusable transporter object using the default SMTP transport
// Lazy initialization to ensure env vars are loaded
let transporter: nodemailer.Transporter | null = null;

interface SendEmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
    console.log("Preparing to send email to:", to);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Email Credentials Missing in Env!");
        console.log("USER Exists:", !!process.env.EMAIL_USER);
        console.log("PASS Exists:", !!process.env.EMAIL_PASS);
        return { success: false, error: "Credentials missing" };
    }

    if (!transporter) {
        console.log("Initializing Transporter with explicit Gmail settings...");
        transporter = nodemailer.createTransport({
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Verify connection configuration
        try {
            await transporter.verify();
            console.log("✅ Server is ready to take our messages");
        } catch (error) {
            console.error("❌ Transporter Verification Error:", error);
        }
    }

    try {
        const info = await transporter.sendMail({
            from: `"ETAMAX 2026" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log('✅ Email sent successfully! Message ID: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error };
    }
}

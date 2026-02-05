import nodemailer from 'nodemailer';

// Create a reusable transporter object using the default SMTP transport
// Lazy initialization to ensure env vars are loaded
let transporter: nodemailer.Transporter | null = null;

interface SendEmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: { filename: string; content: string | Buffer }[];
}

export async function sendEmail({ to, subject, text, html, attachments }: SendEmailOptions) {
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
            host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
            port: Number(process.env.EMAIL_PORT) || 465,
            secure: process.env.EMAIL_SECURE === 'true' || true,
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
            attachments,
        });
        console.log('✅ Email sent successfully! Message ID: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error };
    }
}

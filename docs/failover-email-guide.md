// Failover Email Implementation Guide
// Replace lines 209-308 in route.ts with this code:

// Move criteriaMessage, emailSubject, headerColor, headerText BEFORE the loop
const criteriaMessage = criteriaMet
    ? `<div style="margin-top: 20px; padding: 15px; background-color: #f0fff4; border: 1px solid #b2f5ea; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px; color: #2e7d32;">
            <strong>✅ Congratulations!</strong> You have fulfilled all participation criteria. Please join the WhatsApp groups above.
        </p>
    </div>`
    : `<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>⏳ Criteria Pending</strong><br/>
            To access WhatsApp groups, you need:<br/>
            ${pending.map((p: string) => `• ${p}`).join('<br/>')}
        </p>
    </div>`;

const emailSubject = criteriaMet
    ? `🎉 All Criteria Met! Here is your Master Receipt ✅`
    : `✅ Payment Confirmed - ${allConfirmedRegs.length} Event(s) Registered`;

const headerColor = criteriaMet ? '#28a745' : '#6d28d9';
const headerText = criteriaMet ? 'All Set! 🎉' : 'Payment Successful! ✅';

// Failover Email Logic: Try accounts in order until one succeeds
let emailSent = false;
let lastError = null;

for (const account of accounts) {
    try {
        console.log(`Attempting to send email via ${account.user}...`);
        
        // Detect if Gmail or Hostinger based on email domain
        const isGmail = account.user.includes('@gmail.com');
        
        const transporter = nodemailer.createTransport(
            isGmail
                ? {
                    service: 'gmail',
                    auth: { user: account.user, pass: account.pass },
                }
                : {
                    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
                    port: Number(process.env.EMAIL_PORT) || 465,
                    secure: process.env.EMAIL_SECURE === 'true' || true,
                    auth: { user: account.user, pass: account.pass },
                }
        );

        await transporter.sendMail({
            from: '"Etamax 2026" <' + account.user + '>',
            to: user.email,
            subject: emailSubject,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">${headerText}</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p style="font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
                        <p style="font-size: 16px;">Your payment was successful. Here is your updated list of confirmed events:</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background-color: #f8f9fa; text-align: left;">
                                    <th style="padding: 10px; border-bottom: 2px solid #ddd;">Event</th>
                                    <th style="padding: 10px; border-bottom: 2px solid #ddd;">Date/Time</th>
                                    <th style="padding: 10px; border-bottom: 2px solid #ddd;">WhatsApp</th>
                                    <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${eventRows}
                                <tr style="font-weight: bold; background-color: #f8f9fa;">
                                    <td colspan="3" style="padding: 10px; text-align: right;">Total Paid:</td>
                                    <td style="padding: 10px; text-align: right;">₹${totalCost}</td>
                                </tr>
                            </tbody>
                        </table>

                        ${criteriaMessage}
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            <strong>Disclaimer:</strong> Please ensure your Roll Number is entered correctly. One Roll Number can only be registered with one Login ID. Duplicate registrations may be cancelled.
                        </p>

                        <p style="font-size: 14px; color: #777;">Thank you for your participation!<br/>Regards,<br/><strong>Etamax 2026 Team</strong></p>
                    </div>
                </div>
            `
        });

        console.log(`✅ Email sent successfully via ${account.user}`);
        emailSent = true;
        break; // Success! Exit loop
    } catch (err) {
        console.error(`❌ Failed to send via ${account.user}:`, err);
        lastError = err;
        // Continue to next account
    }
}

if (!emailSent) {
    console.error("All email accounts failed. Last error:", lastError);
    // Don't throw - just log the error so webhook doesn't fail
}

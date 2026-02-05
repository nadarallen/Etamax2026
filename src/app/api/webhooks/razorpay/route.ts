import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Payment, { PaymentStatus } from '@/models/Payment';
import Registration from '@/models/Registration';
import Team, { MemberStatus, PaymentStatus as TeamPaymentStatus, TeamStatus } from '@/models/Team';
import Event from '@/models/Event';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            return NextResponse.json({ error: "Configuration Error" }, { status: 400 });
        }

        // 1. Verify Signature (Prompt 18)
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        if (generatedSignature !== signature) {
            return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
        }

        const event = JSON.parse(rawBody);
        await connectToDatabase();

        // 2. Handle 'payment.captured'
        if (event.event === 'payment.captured') {
            const { order_id, id: payment_id } = event.payload.payment.entity;

            // Find Payment Record with User
            const payment = await Payment.findOne({ gatewayOrderId: order_id }).populate('userId');
            if (!payment) return NextResponse.json({ message: "Ignored: Payment not found locally" });

            if (payment.status === PaymentStatus.SUCCESS) {
                return NextResponse.json({ message: "Already processed" });
            }

            const user = payment.userId as any; // Cast as any because populate can be tricky with types
            if (!user) {
                console.error("Payment Capture Error: No User Linked");
                return NextResponse.json({ error: "No User Linked" }, { status: 400 });
            }

            // Update Payment Status
            payment.status = PaymentStatus.SUCCESS;
            payment.gatewayPaymentId = payment_id;
            await payment.save();

            // 3. Fulfill Order (Registration / Team Update)
            const { userId: uidFromMeta, eventId, slotId, teamId } = payment.metadata as any;

            // Update Team Member Status if Team Event
            if (teamId) {
                const team = await Team.findById(teamId).populate('members.userId');
                if (team) {
                    // Leader pays for everyone - mark ALL members as PAID
                    team.members.forEach((m: any) => {
                        m.paymentStatus = TeamPaymentStatus.PAID;
                    });

                    const event = await Event.findById(eventId);
                    const minSize = event?.minTeamSize || 2;

                    // If team size is sufficient, confirm the team
                    if (team.members.length >= minSize) {
                        team.status = TeamStatus.CONFIRMED;
                        const Slot = (await import('@/models/Slot')).default;
                        // For team events, increment teamsCount (not registeredCount)
                        await Slot.findByIdAndUpdate(slotId, { $inc: { teamsCount: 1 } });
                    }

                    await team.save();

                    // Generate Etamax IDs for all team members
                    const { customAlphabet } = await import('nanoid');
                    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

                    // Create registration records for ALL team members
                    for (const member of team.members) {
                        const memberUser = await User.findById(member.userId);
                        if (!memberUser) continue;

                        const etamaxId = `ETAMAX-${nanoid()}`;

                        await Registration.create({
                            userId: memberUser._id,
                            eventId,
                            teamId,
                            slotId,
                            paymentId: payment._id,
                            status: 'CONFIRMED',
                            qrCodeHash: crypto.randomBytes(16).toString('hex'),
                            etamaxId: etamaxId,
                            fullName: memberUser.name,
                            rollNumber: memberUser.rollNumber || 'N/A',
                            email: memberUser.email,
                            branch: memberUser.branch || 'N/A',
                            semester: memberUser.semester || 'N/A',
                            emailSent: false,
                        });
                    }

                    // Send emails to all team members after all registrations are created
                    // (Email sending logic will be handled below after the solo event block)
                }
            } else {
                // Solo Event: Directly Consume Slot
                const Slot = (await import('@/models/Slot')).default;
                await Slot.findByIdAndUpdate(slotId, { $inc: { registeredCount: 1 } });

                // Generate Etamax ID for solo registration
                const { customAlphabet } = await import('nanoid');
                const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
                const etamaxId = `ETAMAX-${nanoid()}`;

                // Create Registration Record (Receipt Proof)
                await Registration.create({
                    userId: user._id,
                    eventId,
                    teamId,
                    slotId,
                    paymentId: payment._id,
                    status: 'CONFIRMED',
                    qrCodeHash: crypto.randomBytes(16).toString('hex'),
                    etamaxId: etamaxId,
                    // Profile Snapshot
                    fullName: user.name,
                    rollNumber: user.rollNumber || 'N/A',
                    email: user.email,
                    branch: user.branch || 'N/A',
                    semester: user.semester || 'N/A',
                    emailSent: false, // Default
                });
            }

            // Send Success Email
            if (user.email) {
                try {
                    // --- Check Criteria for Email Customization ---
                    const { checkCriteria } = await import('@/lib/criteria');
                    const { met: criteriaMet, pending } = await checkCriteria(user._id.toString());

                    console.log(`Webhook Criteria Check for ${user._id}: ${criteriaMet ? 'MET' : 'PENDING'}`, pending);

                    // Fetch ALL confirmed registrations for this user
                    const allConfirmedRegs = await Registration.find({
                        userId: user._id,
                        status: 'CONFIRMED'
                    })
                        .populate('eventId')
                        .populate('slotId')
                        .populate('teamId');

                    let totalCost = 0;
                    const eventRows = allConfirmedRegs.map((reg: any) => {
                        const evt = reg.eventId;
                        const slt = reg.slotId;
                        const price = evt?.price || 0;
                        totalCost += price;

                        let dateStr = 'TBD';
                        if (slt?.dayNumber) {
                            const dayMap: { [key: number]: string } = {
                                1: 'Feb 12',
                                2: 'Feb 13',
                                3: 'Feb 14'
                            };
                            dateStr = dayMap[slt.dayNumber] || `Day ${slt.dayNumber}`;
                        }

                        // Show WhatsApp link ONLY if criteria are met
                        const finalWaLink = criteriaMet ? slt?.whatsappLink : null;

                        const waLink = finalWaLink
                            ? `<a href="${finalWaLink}" style="color: #25D366; text-decoration: none; font-weight: bold;">Join Group</a>`
                            : '<span style="color: #999;">-</span>';

                        return `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px;">${evt?.name || 'Unknown'}</td>
                            <td style="padding: 10px;">${dateStr} <br/> <small>${slt?.startTime} - ${slt?.endTime}</small></td>
                            <td style="padding: 10px;">${waLink}</td>
                            <td style="padding: 10px; text-align: right;">₹${price}</td>
                        </tr>
                        `;
                    }).join('');

                    const nodemailer = (await import('nodemailer')).default;

                    // Email Rotation Logic
                    const accounts = [];
                    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) accounts.push({ user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS });
                    if (process.env.EMAIL_USER_2 && process.env.EMAIL_PASS_2) accounts.push({ user: process.env.EMAIL_USER_2, pass: process.env.EMAIL_PASS_2 });
                    if (process.env.EMAIL_USER_3 && process.env.EMAIL_PASS_3) accounts.push({ user: process.env.EMAIL_USER_3, pass: process.env.EMAIL_PASS_3 });
                    if (process.env.EMAIL_USER_4 && process.env.EMAIL_PASS_4) accounts.push({ user: process.env.EMAIL_USER_4, pass: process.env.EMAIL_PASS_4 });

                    if (accounts.length === 0) {
                        console.error("No email accounts configured.");
                        throw new Error("No Email Configured");
                    }

                    // Pick random account to distribute load
                    const selectedAccount = accounts[Math.floor(Math.random() * accounts.length)];

                    // Detect if Gmail or Hostinger based on email domain
                    const isGmail = selectedAccount.user.includes('@gmail.com');

                    const transporter = nodemailer.createTransport(
                        isGmail
                            ? {
                                service: 'gmail',
                                auth: { user: selectedAccount.user, pass: selectedAccount.pass },
                            }
                            : {
                                host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
                                port: Number(process.env.EMAIL_PORT) || 465,
                                secure: process.env.EMAIL_SECURE === 'true' || true,
                                auth: { user: selectedAccount.user, pass: selectedAccount.pass },
                            }
                    );

                    // Customize message based on criteria status
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

                    let emailSent = false;
                    let lastError = null;

                    for (const account of accounts) {
                        try {
                            console.log(`Attempting to send email via ${account.user}...`);

                            const isGmail = account.user.includes('@gmail.com');
                            const transporter = nodemailer.createTransport(
                                isGmail
                                    ? { service: 'gmail', auth: { user: account.user, pass: account.pass } }
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
                            break;
                        } catch (err) {
                            console.error(`❌ Failed to send via ${account.user}:`, err);
                            lastError = err;
                        }
                    }

                    if (!emailSent) {
                        console.error("All email accounts failed. Last error:", lastError);
                    }

                    // Update Email Sent Status for all registrations
                    if (emailSent) {
                        await Registration.updateMany(
                            {
                                userId: user._id,
                                eventId,
                                status: 'CONFIRMED',
                                emailSent: false
                            },
                            { emailSent: true }
                        );
                    }
                } catch (emailErr) {
                    console.error("Failed to send success email:", emailErr);
                }
            }

            return NextResponse.json({ status: "ok" });
        }

        else if (event.event === 'payment.failed') {
            const { order_id, id: payment_id } = event.payload.payment.entity;

            // Find Payment Record
            const payment = await Payment.findOne({ gatewayOrderId: order_id }).populate('userId');
            if (payment) {
                payment.status = PaymentStatus.FAILED;
                payment.gatewayPaymentId = payment_id;
                await payment.save();
                console.log(`Payment Failed: ${order_id}`);

                const user = payment.userId as any;
                const { eventId, slotId, teamId } = payment.metadata as any;

                // CLEANUP: Delete registrations and revert changes
                try {
                    if (teamId) {
                        // Team event failure - clean up all members
                        const team = await Team.findById(teamId);
                        if (team) {
                            console.log(`Cleaning up team ${teamId} after payment failure`);

                            // Delete all team member registrations created by this payment
                            const deletedRegs = await Registration.deleteMany({
                                teamId: teamId,
                                paymentId: payment._id
                            });
                            console.log(`Deleted ${deletedRegs.deletedCount} team registrations`);

                            // Revert team status to OPEN (unpaid state)
                            team.status = TeamStatus.OPEN;

                            // Mark all team members as PENDING (unpaid)
                            team.members.forEach((m: any) => {
                                m.paymentStatus = TeamPaymentStatus.PENDING;
                            });
                            await team.save();

                            // Release slot capacity for entire team
                            const Slot = (await import('@/models/Slot')).default;
                            await Slot.findByIdAndUpdate(slotId, {
                                $inc: { teamsCount: -1 }
                            });
                            console.log(`Released slot capacity for 1 team`);
                        }
                    } else {
                        // Solo event failure - clean up user's registration
                        console.log(`Cleaning up solo registration for user ${user._id} after payment failure`);

                        const deletedRegs = await Registration.deleteMany({
                            userId: user._id,
                            eventId: eventId,
                            paymentId: payment._id
                        });
                        console.log(`Deleted ${deletedRegs.deletedCount} solo registration(s)`);

                        // Release slot capacity
                        const Slot = (await import('@/models/Slot')).default;
                        await Slot.findByIdAndUpdate(slotId, {
                            $inc: { registeredCount: -1 }
                        });
                        console.log(`Released slot capacity for solo event`);
                    }
                } catch (cleanupErr) {
                    console.error('Error during payment failure cleanup:', cleanupErr);
                }

                // Send Failure Email
                if (process.env.EMAIL_USER && process.env.EMAIL_PASS && user?.email) {
                    try {
                        const nodemailer = (await import('nodemailer')).default;
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                        });

                        await transporter.sendMail({
                            from: '"Etamax 2026 Payment" <' + process.env.EMAIL_USER + '>',
                            to: user.email,
                            subject: 'Payment Failed - Etamax 2026',
                            html: `
                                <div style="font-family: Arial, sans-serif; color: #333;">
                                    <h2 style="color: #d9534f;">Payment Failed</h2>
                                    <p>Hi ${user.name || 'User'},</p>
                                    <p>We noticed your payment for order <strong>${order_id}</strong> was unsuccessful.</p>
                                    <p>If money was deducted, it will be automatically refunded by your bank within 5-7 working days.</p>
                                    <p>You can try registering again from the website.</p>
                                    <br/>
                                    <p>Best,<br/>Etamax Team</p>
                                </div>
                            `
                        });
                        console.log(`Failed payment email sent to ${user.email}`);
                    } catch (emailErr) {
                        console.error("Failed to send failure email:", emailErr);
                    }
                }
            }
            return NextResponse.json({ status: "logged_failure" });
        }

        return NextResponse.json({ status: "ignored" });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

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
                const team = await Team.findById(teamId);
                if (team) {
                    const member = team.members.find((m: any) => m.userId.toString() === user._id.toString());
                    if (member) {
                        member.paymentStatus = TeamPaymentStatus.PAID;
                        await team.save();
                    }

                    // Check if all paid
                    const allPaid = team.members.every((m: any) => m.paymentStatus === TeamPaymentStatus.PAID);
                    const event = await Event.findById(eventId);

                    if (allPaid && event && event.minTeamSize && team.members.length >= event.minTeamSize) {
                        team.status = TeamStatus.CONFIRMED;
                        const Slot = (await import('@/models/Slot')).default;
                        await Slot.findByIdAndUpdate(slotId, { $inc: { registeredCount: team.members.length } });
                        await team.save();
                    }
                }
            } else {
                // Solo Event: Directly Consume Slot
                const Slot = (await import('@/models/Slot')).default;
                await Slot.findByIdAndUpdate(slotId, { $inc: { registeredCount: 1 } });
            }

            // Generate Etamax ID
            const { customAlphabet } = await import('nanoid');
            const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
            const etamaxId = `ETAMAX-${nanoid()}`;

            // Create Registration Record (Receipt Proof)
            const registration = await Registration.create({
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

            // Send Success Email
            if (user.email) {
                try {
                    // Fetch Event and Slot Details for Email
                    const eventDetails = await Event.findById(eventId);
                    const Slot = (await import('@/models/Slot')).default;
                    const slotDetails = await Slot.findById(slotId);

                    let formattedDate = 'TBD';
                    if (slotDetails && slotDetails.dayNumber) {
                        const dayMap: { [key: number]: string } = {
                            1: 'February 12, 2026',
                            2: 'February 13, 2026',
                            3: 'February 14, 2026'
                        };
                        formattedDate = dayMap[slotDetails.dayNumber] || `Day ${slotDetails.dayNumber}`;
                    }

                    const nodemailer = (await import('nodemailer')).default;

                    // Email Rotation Logic
                    // We check for EMAIL_USER, EMAIL_USER_2, EMAIL_USER_3, EMAIL_USER_4
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

                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: { user: selectedAccount.user, pass: selectedAccount.pass },
                    });

                    await transporter.sendMail({
                        from: '"Etamax 2026" <' + selectedAccount.user + '>',
                        to: user.email,
                        subject: `Registration Successful for ${eventDetails?.name || 'Etamax Event'} ✅`,
                        html: `
                            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                                <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px;">Registration Confirmed!</h1>
                                </div>
                                <div style="padding: 20px;">
                                    <p style="font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
                                    <p style="font-size: 16px;">Your registration for <strong>${eventDetails?.name}</strong> has been confirmed successfully ✅</p>
                                    
                                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                        <p style="margin: 5px 0;"><strong>📌 Event:</strong> ${eventDetails?.name}</p>
                                        <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                                        <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${slotDetails?.startTime} - ${slotDetails?.endTime}</p>
                                        <p style="margin: 5px 0;"><strong>📍 Venue:</strong> ${slotDetails?.venue}</p>
                                        <p style="margin: 5px 0;"><strong>🆔 Registration ID:</strong> ${etamaxId}</p>
                                        ${eventDetails?.whatsappLink ? `<p style="margin: 5px 0;"><strong>📱 WhatsApp Group:</strong> <a href="${eventDetails.whatsappLink}" style="color: #28a745; text-decoration: none;">Join Here</a></p>` : ''}
                                    </div>

                                    <p style="font-size: 16px;"><strong>Payment Status:</strong> <span style="color: #28a745; font-weight: bold;">SUCCESS ✅</span></p>
                                    <p style="font-size: 14px; color: #555;">Please save this email or your QR code (available on your dashboard) for entry.</p>
                                    
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                                    
                                    <p style="font-size: 14px; color: #777;">Thank you for registering!<br/>Regards,<br/><strong>Etamax 2026 Team</strong></p>
                                </div>
                            </div>
                        `
                    });

                    // Update Email Sent Status
                    registration.emailSent = true;
                    await registration.save();

                    console.log(`Success email sent to ${user.email} for ${eventDetails?.name} via ${selectedAccount.user}`);
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

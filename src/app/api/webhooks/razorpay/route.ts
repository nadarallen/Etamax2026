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
            // Fix: Include all required fields from User profile
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
            });

            // Send Success Email
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS && user.email) {
                try {
                    const nodemailer = (await import('nodemailer')).default;
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                    });

                    await transporter.sendMail({
                        from: '"Etamax 2026" <' + process.env.EMAIL_USER + '>',
                        to: user.email,
                        subject: `Registration Confirmed - Etamax 2026`,
                        html: `
                            <div style="font-family: Arial, sans-serif; color: #333;">
                                <h1 style="color: #28a745;">Registration Confirmed!</h1>
                                <p>Hi ${user.name},</p>
                                <p>We have received your payment for order <strong>${order_id}</strong>.</p>
                                <p><strong>Registration ID:</strong> ${etamaxId}</p>
                                <hr />
                                <p>Please show this email or your QR code (on the dashboard) at the venue.</p>
                                <br/>
                                <p>Best,<br/>Etamax Team</p>
                            </div>
                        `
                    });
                    console.log(`Success email sent to ${user.email}`);
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

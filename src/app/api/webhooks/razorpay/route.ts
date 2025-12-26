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

            // Find Payment Record
            const payment = await Payment.findOne({ gatewayOrderId: order_id });
            if (!payment) return NextResponse.json({ message: "Ignored: Payment not found locally" });

            if (payment.status === PaymentStatus.SUCCESS) {
                return NextResponse.json({ message: "Already processed" });
            }

            // Update Payment Status
            payment.status = PaymentStatus.SUCCESS;
            payment.gatewayPaymentId = payment_id;
            await payment.save();

            // 3. Fulfill Order (Registration / Team Update)
            const { userId, eventId, slotId, teamId } = payment.metadata as any;

            // Update Team Member Status if Team Event
            let teamUpdated = false;
            if (teamId) {
                const team = await Team.findById(teamId);
                if (team) {
                    const member = team.members.find((m: any) => m.userId.toString() === userId.toString());
                    if (member) {
                        member.paymentStatus = TeamPaymentStatus.PAID;
                        await team.save();
                    }

                    // Check if all paid (Prompt 13)
                    const allPaid = team.members.every((m: any) => m.paymentStatus === TeamPaymentStatus.PAID);
                    if (allPaid && team.members.length >= (await Event.findById(eventId))!.minTeamSize) {
                        team.status = TeamStatus.CONFIRMED;
                        // Prompt 14: Consume Slot Capacity
                        await Event.updateOne(
                            { 'slots._id': slotId },
                            { $inc: { 'slots.$.bookedCount': team.members.length } } // Atomic Increment
                        );
                        await team.save();
                        teamUpdated = true;
                    }
                }
            } else {
                // Solo Event: Directly Consume Slot
                await Event.updateOne(
                    { 'slots._id': slotId },
                    { $inc: { 'slots.$.bookedCount': 1 } }
                );
            }

            // Create Registration Record (Receipt Proof)
            await Registration.create({
                userId,
                eventId,
                teamId,
                slotId,
                paymentId: payment._id,
                status: 'CONFIRMED',
                qrCodeHash: crypto.randomBytes(16).toString('hex'), // Placeholder
            });

            return NextResponse.json({ status: "ok" });
        }

        return NextResponse.json({ status: "ignored" });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

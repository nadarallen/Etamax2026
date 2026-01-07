'use server';

import razorpay from '@/lib/razorpay';
import connectToDatabase from '@/lib/db';
import Payment, { PaymentStatus, PaymentMethod } from '@/models/Payment';
import Event from '@/models/Event';
import Team, { TeamStatus, PaymentStatus as TeamPaymentStatus } from '@/models/Team';
import Registration from '@/models/Registration';
import { getSession } from '@/lib/auth';
import { randomUUID } from 'crypto';

// Prompt 17: Initiate Payment
export async function initiatePaymentAction(eventId: string, slotId: string, teamId?: string) {
    const session = await getSession();
    if (!session || !session.user.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        // 1. Fetch Price
        const event = await Event.findById(eventId);
        if (!event) return { error: "Event not found" };

        const amount = event.price * 100; // Paise
        const currency = 'INR';

        // 2. Create Razorpay Order
        // Implement Rate Limiting here in production
        const options = {
            amount: amount,
            currency: currency,
            receipt: randomUUID(),
            notes: {
                userId: session.user.id,
                eventId: eventId,
                slotId: slotId,
                teamId: teamId || '',
            }
        };

        // Check for Mock Mode
        const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder');

        let order;
        if (isMock) {
            order = { id: `mock_order_${randomUUID()}` };
        } else {
            order = await razorpay.orders.create(options as any);
        }

        // 3. Create Local Payment Record
        await Payment.create({
            userId: session.user.id,
            amount: event.price, // Storing in Rupees in DB for readability or paise? Model usually stores what you prefer. Let's assume Rupees as per previous chats, but consistency matters. Let's store Rupees.
            currency: 'INR',
            method: PaymentMethod.ONLINE,
            status: PaymentStatus.INITIATED,
            gatewayOrderId: order.id,
            metadata: {
                eventId,
                slotId,
                teamId,
            }
        });

        return {
            success: true,
            isMock,
            orderId: order.id,
            amount: amount,
            key: process.env.RAZORPAY_KEY_ID
        };

    } catch (error) {
        console.error("Payment Init Error:", error);
        return { error: "Failed to initiate payment" };
    }
}

// Prompt 20 (Simulated): Mock Webhook Trigger
// In real dev, we might use the actual webhook route, but for pure simulation without ngrok:
export async function simulateMockPaymentAction(orderId: string) {
    const session = await getSession();
    if (!session || !session.user.id) return { error: "Unauthorized" };

    await connectToDatabase();
    const payment = await Payment.findOne({ gatewayOrderId: orderId });
    if (!payment) return { error: "Payment not found" };

    // Reuse the Webhook Logic Structure
    // (In a real app, refactor `fulfillPayment` to a shared service to avoid duplication)
    // Copied logic for demo speed:

    payment.status = PaymentStatus.SUCCESS;
    payment.gatewayPaymentId = `mock_pay_${randomUUID()}`;
    await payment.save();

    const { userId, eventId, slotId, teamId } = payment.metadata as any;

    // Importing Team/Event inside function to avoid circular deps if any (though usually fine)
    const Team = (await import('@/models/Team')).default;
    const Event = (await import('@/models/Event')).default;
    // Registration needs to be imported or use model string
    const Registration = (await import('@/models/Registration')).default;
    // Enum imports
    // Actually we need to just update DB directly or use the models we imported at top if available.
    // We imported Payment, Event at top. Team is missing in imports.

    if (teamId) {
        const team = await Team.findById(teamId);
        if (team) {
            const member = team.members.find((m: any) => m.userId.toString() === userId.toString());
            if (member) {
                member.paymentStatus = TeamPaymentStatus.PAID; // Hardcoding string to avoid import hell in this file
                await team.save();
            }
            const allPaid = team.members.every((m: any) => m.paymentStatus === 'PAID');
            // Safe fetch
            const eventDoc = await Event.findById(eventId);
            const minSize = eventDoc?.minTeamSize || 1;
            if (allPaid && team.members.length >= minSize) {
                team.status = TeamStatus.CONFIRMED;
                // Update Slot Capacity
                const Slot = (await import('@/models/Slot')).default;
                await Slot.findByIdAndUpdate(slotId, { $inc: { registeredCount: team.members.length } });
                await team.save();
            }
        }
    } else {
        // Update Slot Capacity
        const Slot = (await import('@/models/Slot')).default;
        await Slot.findByIdAndUpdate(slotId, { $inc: { registeredCount: 1 } });
    }

    await Registration.create({
        userId,
        eventId,
        teamId,
        slotId,
        paymentId: payment._id,
        status: 'CONFIRMED',
        qrCodeHash: randomUUID(),
    });

    return { success: true };
}

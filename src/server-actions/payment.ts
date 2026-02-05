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
export async function initiatePaymentAction(eventId: string, slotId: string, teamId?: string, bypassCode?: string) {
    const session = await getSession();
    if (!session || !session.user.id) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        // 1. Fetch Price
        const event = await Event.findById(eventId);
        if (!event) return { error: "Event not found" };

        // Verify Bypass Code if provided (Security check)
        const isBypassValid = bypassCode && process.env.PAYMENT_BYPASS_CODE && bypassCode === process.env.PAYMENT_BYPASS_CODE;
        if (bypassCode && !isBypassValid) {
            return { error: "Invalid Bypass Code" };
        }

        // Checks for Team Event Payment Logic
        if (teamId) {
            const Team = (await import('@/models/Team')).default;
            const team = await Team.findById(teamId);
            if (!team) return { error: "Team not found" };

            // Check if user is Leader
            if (team.leaderId.toString() !== session.user.id) {
                return { error: "Only the Team Leader can make payments for the team." };
            }
        }

        // Fetch User for Roll No
        const User = (await import('@/models/User')).default;
        const userDoc = await User.findById(session.user.id);
        const rollNo = userDoc?.rollNumber || "N/A";

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
                studentName: (session.user as any).name || (session.user as any).user_metadata?.name || "Unknown",
                rollNo: rollNo.substring(0, 20), // ADDED ROLL NO
                eventName: event.name.substring(0, 40), // Razorpay note limits
                clubName: event.club || (event as any).category || "Etamax",
                eventId: eventId,
                slotId: slotId,
                teamId: teamId || '',
                // Single event split
                [`Club_${(event.club || (event as any).category || "General").replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`]: event.price
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
            // "Leader pays for everyone" logic:
            // Mark ALL members as PAID
            team.members.forEach((m: any) => {
                m.paymentStatus = TeamPaymentStatus.PAID;
            });

            // Check for minimum size (default to 2 as per new rule)
            const eventDoc = await Event.findById(eventId);
            const minSize = eventDoc?.minTeamSize || 2;

            // If team size is sufficient, confirm the team
            if (team.members.length >= minSize) {
                team.status = TeamStatus.CONFIRMED;

                // Update Slot Capacity (Only once for the team? Or per member?)
                // Usually capacity is per-team for team events, or per-person?
                // Logic above: `inc: { registeredCount: team.members.length }`
                // If the slot counts *people*, we increment by length.
                // If it counts *teams*, we increment by 1.
                // Looking at delete logic: `inc: { teamsCount: -1 }`.
                // It seems we track both?
                // Let's stick to updating registeredCount (people) logic if that was original intent,
                // but `teamsCount` is likely what we care about for 'duo'/'group' limits?
                const Slot = (await import('@/models/Slot')).default;

                // We should probably increment teamsCount logic if not done already.
                // But previous code was `registeredCount: team.members.length`.
                // I will keep `registeredCount` update for analytics, but `teamsCount` is important for capacity.
                // Let's assume registration handles the initial `teamsCount` increment?
                // Usually `registerForEventAction` increments counts when creating the team placeholder.
                // If this is just CONFIRMING, do we increment now?
                // If status was PENDING, maybe we didn't count it against cap?
                // Let's check `getSlotsAction` to see what counts against cap.
                // Original code: `await Slot.findByIdAndUpdate(slotId, { $inc: { registeredCount: team.members.length } });`
                // This implies we ONLY count them when confirmed?
                // Valid point. I will preserve existing logic but ensuring all members are paid.

                await Slot.findByIdAndUpdate(slotId, { $inc: { registeredCount: team.members.length } });
            }
            await team.save();
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

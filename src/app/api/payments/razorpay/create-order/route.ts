import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectToDatabase from '@/lib/db';
import Registration from '@/models/Registration';
import Event from '@/models/Event';
import { getSession } from '@/lib/auth';
import { nanoid } from 'nanoid';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { eventId, slotId, teamId, amount } = await req.json();

        await connectToDatabase();

        // 1. Verify Event and Slot
        const event = await Event.findById(eventId);
        if (!event) return new NextResponse('Event not found', { status: 404 });

        const slot = event.slots.find((s: any) => s._id.toString() === slotId);
        if (!slot) return new NextResponse('Slot not found', { status: 404 });

        if (slot.bookedCount >= slot.capacity) {
            return new NextResponse('Slot is fully booked', { status: 400 });
        }

        // 2. Create Razorpay Order
        // Amount in paisa
        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `rcpt_${nanoid(10)}`,
            notes: {
                eventId: eventId,
                slotId: slotId,
                userId: session.userId,
                teamId: teamId || ''
            }
        };

        const order = await razorpay.orders.create(options);

        // 3. DO NOT create Registration yet? 
        // Or create PENDING registration?
        // Standard flow: Create Order -> Client Pay -> Webhook/Verification -> Create Registration.
        // But to reserve the slot, we might want to hold it? 
        // For now, let's keep it simple: Validate slot here, but only increment on success.
        // Risk: Overbooking if many users pay simultaneously.
        // Improved flow: Create PENDING registration here.

        return NextResponse.json(order);

    } catch (error) {
        console.error('Razorpay Error:', error);
        return new NextResponse('Payment Initialization Failed', { status: 500 });
    }
}

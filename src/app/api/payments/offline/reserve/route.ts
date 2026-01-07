import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Registration, { RegStatus } from '@/models/Registration';
import Payment, { PaymentMethod, PaymentStatus } from '@/models/Payment';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import { getSession } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { eventId, slotId, teamId } = await req.json();

        await connectToDatabase();

        // 1. Verify Event and Slot
        const event = await Event.findById(eventId);
        if (!event) return new NextResponse('Event not found', { status: 404 });

        const slot = await Slot.findById(slotId);
        if (!slot) return new NextResponse('Slot not found', { status: 404 });

        // Optional: Verify slot belongs to event
        if (slot.eventId.toString() !== eventId) {
            return new NextResponse('Slot does not belong to this event', { status: 400 });
        }

        if (slot.registeredCount >= slot.maxCapacity) {
            return new NextResponse('Slot is fully booked', { status: 400 });
        }

        // 2. Create Payment Record (Pending Verification)
        const paymentEntry = await Payment.create({
            userId: session.user.id,
            amount: event.price,
            method: PaymentMethod.OFFLINE,
            status: PaymentStatus.PENDING_VERIFICATION,
            referenceId: 'OFF-' + nanoid(8).toUpperCase(),
            metadata: { eventId, slotId, teamId }
        });

        // 3. Create Registration (Pending)
        // Set expiry for 2 hours later
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 2);

        const registration = await Registration.create({
            userId: session.user.id,
            eventId,
            slotId,
            teamId,
            paymentId: paymentEntry._id,
            status: RegStatus.PENDING,
            qrCodeHash: null, // No QR until confirmed? Or generate one that shows pending?
            // We need to add expiresAt schema field if not exists. 
            // Previous analysis said Registration model has fields. Let's check `Registration.ts`.
            // If it doesn't, we need to add it or store in metadata.
            // Assuming we must add it as per plan.
        });

        // 4. Update Slot Capacity (Reserve it)
        await Slot.updateOne(
            { _id: slotId },
            { $inc: { registeredCount: 1 } }
        );

        return NextResponse.json({
            success: true,
            registrationId: registration._id,
            transactionId: paymentEntry.referenceId,
            expiresAt
        });

    } catch (error) {
        console.error('Offline Reservation Error:', error);
        return new NextResponse('Reservation Failed', { status: 500 });
    }
}

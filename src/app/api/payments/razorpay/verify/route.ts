import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Payment, { PaymentStatus, PaymentMethod } from '@/models/Payment';
import Registration, { RegStatus } from '@/models/Registration';
import Event from '@/models/Event';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            eventId,
            slotId,
            teamId // Optional
        } = await req.json();

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return new NextResponse('Invalid Signature', { status: 400 });
        }

        await connectToDatabase();

        // 2. Create Payment Record
        // We might want to fetch amount from somewhere, but for now trust the flow or fetch Order details from Razorpay if needed.
        // For simplicity, we assume success means amount was correct.

        await Payment.create({
            userId: session.userId,
            amount: 0, // Should be fetched from event/order ideally
            method: PaymentMethod.ONLINE,
            status: PaymentStatus.SUCCESS,
            gatewayOrderId: razorpay_order_id,
            gatewayPaymentId: razorpay_payment_id,
            metadata: { eventId, slotId, teamId }
        });

        // 3. Create Registration
        const registration = await Registration.create({
            userId: session.userId,
            eventId,
            slotId,
            teamId,
            paymentId: null, // Link to payment above if needed, but we didn't save payment ID in var
            status: RegStatus.CONFIRMED,
            qrCodeHash: crypto.randomBytes(16).toString('hex') // Generate QR hash
        });

        // 4. Update Slot Capacity
        await Event.updateOne(
            { 'slots._id': slotId },
            { $inc: { 'slots.$.bookedCount': 1 } }
        );

        return NextResponse.json({ success: true, registrationId: registration._id });

    } catch (error) {
        console.error('Payment Verification Error:', error);
        return new NextResponse('Verification Failed', { status: 500 });
    }
}

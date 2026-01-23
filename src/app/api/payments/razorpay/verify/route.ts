import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Payment, { PaymentStatus, PaymentMethod } from '@/models/Payment';
import Registration, { RegStatus } from '@/models/Registration';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
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

        // 2a. Fetch Payment Record to get Metadata (Critical for Bulk)
        const paymentRecord = await Payment.findOne({ gatewayOrderId: razorpay_order_id });
        if (!paymentRecord) {
            return new NextResponse('Payment Record Not Found', { status: 404 });
        }

        // 2b. Update Payment Status
        paymentRecord.status = PaymentStatus.SUCCESS;
        paymentRecord.gatewayPaymentId = razorpay_payment_id;
        await paymentRecord.save();

        const metadata = paymentRecord.metadata || {};
        const registrationIds = metadata.registrationIds;

        if (registrationIds && Array.isArray(registrationIds)) {
            // BULK UPDATE
            await Registration.updateMany(
                { _id: { $in: registrationIds } },
                {
                    status: RegStatus.CONFIRMED,
                    paymentId: paymentRecord._id
                }
            );

            // TODO: Send emails for each? Or one master receipt?
            // For now, assume one master email or individual emails triggered by a background job
        } else {
            // Fallback for single legacy (if any) or if metadata missing
            console.log("No registration IDs found in metadata for bulk payment");
        }

        // 4. Update Slot Capacity - ALREADY DONE AT RESERVATION TIME (Optimistic)
        // So we don't need to increment again.

        return NextResponse.json({ success: true, paymentId: paymentRecord._id });
    } catch (error) {
        console.error('Payment Verification Error:', error);
        return new NextResponse('Verification Failed', { status: 500 });
    }
}

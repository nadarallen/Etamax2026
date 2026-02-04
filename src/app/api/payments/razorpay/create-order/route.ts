import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectToDatabase from '@/lib/db';
import Registration from '@/models/Registration';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import Payment, { PaymentStatus, PaymentMethod } from '@/models/Payment';
import { getSession } from '@/lib/auth';
import { nanoid } from 'nanoid';
import User from '@/models/User';

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
        const body = await req.json();
        const { registrationIds } = body;

        // Support legacy single event flow if needed, OR enforce registrationIds
        if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
            return new NextResponse('No registrations selected', { status: 400 });
        }

        await connectToDatabase();
        (await import('@/models/Event')).default; // Load Event model

        // 1. Fetch Registrations
        const registrations = await Registration.find({
            _id: { $in: registrationIds },
            userId: session.user.id,
            status: { $ne: 'CANCELLED' } // Safety
        }).populate('eventId');

        if (registrations.length !== registrationIds.length) {
            return new NextResponse('Some registrations not found or invalid', { status: 400 });
        }

        // 2. Calculate Total Amount
        let totalAmount = 0;
        registrations.forEach((reg: any) => {
            if (reg.eventId && reg.eventId.price) {
                totalAmount += reg.eventId.price;
            }
        });

        if (totalAmount <= 0) {
            // Free events? Handle gracefully or error. 
            // Ideally free events shouldn't reach payment gateway unless mixed with paid.
            // If ALL free, frontend should handle "Mark as Confirmed" without Razorpay.
            return new NextResponse('Total amount is 0', { status: 400 });
        }

        // 2.5 Collect Metadata for Report
        const eventNames = registrations.map((r: any) => r.eventId?.name).filter(Boolean).join(', ');
        const clubNames = registrations.map((r: any) => r.eventId?.club || r.eventId?.category).filter(Boolean).join(', ');
        const studentName = (session.user as any).name || (session.user as any).user_metadata?.name || "Unknown";

        // Calculate Club Splits
        const clubSplits: Record<string, number> = {};
        registrations.forEach((reg: any) => {
            if (reg.eventId && reg.eventId.price) {
                const rawClub = reg.eventId.club || reg.eventId.category || "General";
                // Razorpay Key Limit: 30 chars. "Club_" is 5. We take max 20 chars of name.
                const cleanClubKey = `Club_${rawClub.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;
                clubSplits[cleanClubKey] = (clubSplits[cleanClubKey] || 0) + reg.eventId.price;
            }
        });

        console.log("Club Splits Debug:", clubSplits); // Debug Log

        // 3. Create Razorpay Order

        // Fetch User for Roll No
        // connectToDatabase() already called above
        const user = await User.findById(session.user.id);
        const rollNo = user?.rollNumber || "N/A";

        const options = {
            amount: Math.round(totalAmount * 100), // in paisa
            currency: 'INR',
            receipt: `rcpt_${nanoid(10)}`,
            notes: {
                userId: session.user.id,
                studentName: studentName.substring(0, 40),
                rollNo: rollNo.substring(0, 20), // ADDED ROLL NO
                eventName: eventNames.substring(0, 40), // Truncate to avoid error
                clubName: clubNames.substring(0, 40),
                regIds: JSON.stringify(registrationIds),
                count: registrationIds.length,
                ...clubSplits // Spread club totals
            }
        };

        const order = await razorpay.orders.create(options);

        // 4. Create Local Payment Record
        await Payment.create({
            userId: session.user.id,
            amount: totalAmount,
            currency: 'INR',
            method: PaymentMethod.ONLINE,
            status: PaymentStatus.INITIATED,
            gatewayOrderId: order.id,
            metadata: {
                registrationIds, // Store array
                type: 'BULK_REGISTRATION'
            }
        });

        return NextResponse.json(order);

    } catch (error) {
        console.error('Razorpay Error:', error);
        return new NextResponse('Payment Initialization Failed', { status: 500 });
    }
}

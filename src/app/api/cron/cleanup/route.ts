import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Registration, { RegStatus } from '@/models/Registration';
import Event from '@/models/Event';

export async function GET(req: NextRequest) {
    // 1. Auth Check (Secure Cron)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        await connectToDatabase();

        // 2. Find Expired Offline Registrations (PENDING status)
        const expiredRegistrations = await Registration.find({
            status: RegStatus.PENDING,
            expiresAt: { $lt: new Date() }
        });

        const results = {
            expired: expiredRegistrations.length,
            releasedSlots: 0,
            errors: 0
        };

        // 3. Process Expiry
        for (const reg of expiredRegistrations) {
            try {
                // Update Registration Status
                reg.status = RegStatus.CANCELLED; // Or 'EXPIRED'
                await reg.save();

                // Release Slot (Correctly using Slot model)
                const Slot = (await import('@/models/Slot')).default;
                await Slot.findByIdAndUpdate(reg.slotId, { $inc: { registeredCount: -1 } });

                results.releasedSlots++;

            } catch (e) {
                console.error(`Failed to expire registration ${reg._id}`, e);
                results.errors++;
            }
        }

        return NextResponse.json({ success: true, ...results });

    } catch (error) {
        console.error("Cron Error", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

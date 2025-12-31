import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Registration from '@/models/Registration';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

        // Check if user is authenticated and is an admin
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        let totalEvents = 0;
        let totalRegistrations = 0;
        let totalRevenue = 0;

        if (session.role === Role.SUPER_ADMIN) {
            // Super admin stats - all events
            totalEvents = await Event.countDocuments({});
            totalRegistrations = await Registration.countDocuments({});
            
            const revenueData = await Registration.aggregate([
                { $group: { _id: null, total: { $sum: '$amountPaid' } } }
            ]);
            totalRevenue = revenueData[0]?.total || 0;
        } else {
            // Club admin stats - only their events
            totalEvents = await Event.countDocuments({ clubId: session.userId });
            totalRegistrations = await Registration.countDocuments({ eventId: { $in: await Event.find({ clubId: session.userId }).select('_id') } });
            
            const revenueData = await Registration.aggregate([
                {
                    $lookup: {
                        from: 'events',
                        localField: 'eventId',
                        foreignField: '_id',
                        as: 'event'
                    }
                },
                { $match: { 'event.clubId': session.userId } },
                { $group: { _id: null, total: { $sum: '$amountPaid' } } }
            ]);
            totalRevenue = revenueData[0]?.total || 0;
        }

        return NextResponse.json({
            stats: {
                totalEvents,
                totalRegistrations,
                totalRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

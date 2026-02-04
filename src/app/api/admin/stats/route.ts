import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
import { getSession, Role } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== Role.SUPER_ADMIN) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await connectToDatabase();

        // Run queries in parallel for performance optimization
        const [totalEvents, totalRegistrations, revenueAgg] = await Promise.all([
            Event.countDocuments({}),
            Registration.countDocuments({ status: 'CONFIRMED' }),
            Registration.aggregate([
                { $match: { status: 'CONFIRMED' } },
                {
                    $lookup: {
                        from: 'events',
                        localField: 'eventId',
                        foreignField: '_id',
                        as: 'event'
                    }
                },
                { $unwind: '$event' },
                {
                    $group: {
                        _id: { $ifNull: ["$event.club", "$event.category"] }, // Group by Club, fallback to Category
                        revenue: { $sum: '$event.price' }
                    }
                },
                { $sort: { revenue: -1 } } // Sort highest revenue first
            ])
        ]);

        // Transform into cleaner array
        const clubStats = revenueAgg.map(item => ({
            club: item._id || "Unknown",
            revenue: item.revenue
        }));

        const totalRevenue = clubStats.reduce((acc, curr) => acc + curr.revenue, 0);

        return NextResponse.json({
            stats: {
                totalEvents,
                totalRegistrations,
                totalRevenue,
                clubStats // New Field
            }
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

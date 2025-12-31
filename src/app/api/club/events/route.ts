import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
import { getSession, Role } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || (session.role !== Role.CLUB_ADMIN && session.role !== Role.SUPER_ADMIN)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await connectToDatabase();

        // TODO: Implement proper Club <-> Admin mapping. Currently showing all events or empty.
        const query = session.role === Role.SUPER_ADMIN ? {} : {}; // { club: 'Tech Club' };
        const events = await Event.find(query).sort({ createdAt: -1 });

        // Calculate simple stats for the club
        const totalEvents = events.length;

        // Count registrations for these events
        const eventIds = events.map(e => e._id);
        const totalRegistrations = await Registration.countDocuments({
            eventId: { $in: eventIds },
            status: 'CONFIRMED'
        });

        return NextResponse.json({
            events,
            stats: {
                totalEvents,
                totalRegistrations
            }
        });
    } catch (error) {
        console.error('Club Events Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

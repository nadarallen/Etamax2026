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
        const { getEventsAction } = await import('@/server-actions/events');

        // TODO: Implement proper Club filtering if needed. getEventsAction returns all.
        const events = await getEventsAction();

        // Calculate simple stats for the club
        const totalEvents = events.length;

        // stats.totalRegistered is already in each event
        const totalRegistrations = events.reduce((acc: number, ev: any) => acc + (ev.stats?.totalRegistered || 0), 0);

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

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

        // Check if user is authenticated and is an admin
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        let events;
        if (session.role === Role.SUPER_ADMIN) {
            // Super admin can see all events
            events = await Event.find({});
        } else {
            // Club admin can only see their club's events
            events = await Event.find({ clubId: session.userId });
        }

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Error fetching admin events:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

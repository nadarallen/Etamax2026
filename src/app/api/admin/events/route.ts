import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { getSession, Role } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== Role.SUPER_ADMIN) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await connectToDatabase();
        // Fetch all events, including unpublished ones
        const events = await Event.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Admin Events Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

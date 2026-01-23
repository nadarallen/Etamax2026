import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
import { getSession, Role } from '@/lib/auth';

export async function GET(req: NextRequest) {
    // const session = await getSession();
    // if (!session || session.role !== Role.SUPER_ADMIN) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }

    try {
        await connectToDatabase();

        // Get all valid event IDs
        const events = await Event.find({}).select('_id');
        const validEventIds = events.map(e => e._id.toString());

        // Delete registrations with invalid eventId
        const result = await Registration.deleteMany({
            eventId: { $nin: validEventIds }
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `Deleted ${result.deletedCount} orphaned registrations.`
        });
    } catch (error) {
        console.error('Cleanup Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

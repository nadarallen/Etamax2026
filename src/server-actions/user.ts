'use server';

import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function getUserProfileAction() {
    const session = await getSession();
    if (!session || !session.user?.id) return null;

    try {
        await connectToDatabase();
        const user = await User.findById(session.user.id);
        if (!user) return null;

        return {
            fullName: user.name,
            email: user.email,
            rollNumber: user.rollNumber,
            branch: user.branch,
            semester: user.semester
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

export async function getUserRegistrationsAction() {
    const session = await getSession();
    if (!session || !session.user?.id) return { error: 'Not authenticated' };

    try {
        await connectToDatabase();
        // Import Registration dynamically or ensure it's imported at top
        const Registration = (await import('@/models/Registration')).default;

        console.log("Fetching registrations for User ID:", session.user.id);
        const registrations = await Registration.find({ userId: session.user.id })
            .populate('eventId')
            .populate('slotId')
            .sort({ createdAt: -1 })
            .lean();

        console.log(`Found ${registrations.length} registrations for user ${session.user.id}`);
        if (registrations.length > 0) {
            console.log("First registration sample:", registrations[0]);
        }

        // Serialize serialization to avoid "plain object" errors
        const serialized = registrations.map((reg: any) => ({
            _id: reg._id.toString(),
            status: reg.status,
            createdAt: reg.createdAt.toISOString(),
            event: reg.eventId ? {
                _id: reg.eventId._id.toString(),
                name: reg.eventId.name,
                category: reg.eventId.category,
            } : null,
            slot: reg.slotId ? {
                _id: reg.slotId._id.toString(),
                startTime: reg.slotId.startTime ? new Date(reg.slotId.startTime).toISOString() : null,
                venue: reg.slotId.venue || 'TBD',
            } : null,
        }));

        return { registrations: serialized };
    } catch (error) {
        console.error('Error fetching user registrations:', error);
        return { error: 'Failed to fetch registrations' };
    }
}

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

        // Ensure models are registered
        (await import('@/models/Event')).default;
        const SlotModel = (await import('@/models/Slot')).default;
        const TeamModel = (await import('@/models/Team')).default;

        console.log("Fetching registrations for User ID:", session.user.id);
        const registrations = await Registration.find({ userId: session.user.id })
            .populate('eventId')
            .populate({ path: 'slotId', model: SlotModel })
            .populate({
                path: 'teamId',
                model: TeamModel,
                populate: { path: 'slotId', model: SlotModel } // Nested populate for team slot
            })
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
            paymentMethod: reg.paymentMethod, // Include paymentMethod
            createdAt: reg.createdAt.toISOString(),
            event: reg.eventId ? {
                _id: reg.eventId._id.toString(),
                name: reg.eventId.name,
                category: reg.eventId.category,
                price: reg.eventId.price,
                type: reg.eventId.type,
            } : null,
            slot: (reg.slotId || reg.teamId?.slotId) ? {
                _id: (reg.slotId || reg.teamId.slotId)._id.toString(),
                startTime: (reg.slotId || reg.teamId.slotId).startTime,
                venue: (reg.slotId || reg.teamId.slotId).venue || 'TBD',
                dayNumber: (reg.slotId || reg.teamId.slotId).dayNumber,
            } : null,
            team: reg.teamId ? {
                _id: reg.teamId._id.toString(),
                name: reg.teamId.name,
                code: reg.teamId.code,
                leaderId: reg.teamId.leaderId.toString(),
                memberCount: reg.teamId.members.length,
                maxTeamSize: reg.eventId.maxTeamSize,
                isFull: reg.teamId.members.length >= (reg.eventId.maxTeamSize || 1), // Assuming maxTeamSize might be missing for some
            } : null,
        }));


        return { registrations: serialized };
    } catch (error) {
        console.error('Error fetching user registrations:', error);
        return { error: 'Failed to fetch registrations' };
    }
}

// Fetch team memberships where user hasn't received a registration yet (waiting for leader payment)
export async function getPendingTeamMembershipsAction() {
    const session = await getSession();
    if (!session || !session.user?.id) return { error: 'Not authenticated' };

    try {
        await connectToDatabase();
        const TeamModel = (await import('@/models/Team')).default;
        const EventModel = (await import('@/models/Event')).default;
        const SlotModel = (await import('@/models/Slot')).default;
        const Registration = (await import('@/models/Registration')).default;

        // Find teams where user is a member
        const teams = await TeamModel.find({
            'members.userId': session.user.id,
            status: { $ne: 'CONFIRMED' } // Team not yet confirmed (leader hasn't paid)
        })
            .populate('eventId')
            .populate('slotId')
            .lean();

        // Filter out teams where user already has a registration
        const pendingMemberships = [];
        for (const team of teams) {
            const hasRegistration = await Registration.exists({
                userId: session.user.id,
                teamId: team._id
            });

            if (!hasRegistration && team.eventId) {
                const event = team.eventId as any;
                const slot = team.slotId as any;

                pendingMemberships.push({
                    _id: team._id.toString(),
                    name: team.name,
                    code: team.code,
                    status: team.status,
                    event: {
                        _id: event._id.toString(),
                        name: event.name,
                        category: event.category,
                        type: event.type,
                        price: event.price,
                    },
                    slot: slot ? {
                        _id: slot._id.toString(),
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        venue: slot.venue || 'TBD',
                        dayNumber: slot.dayNumber,
                    } : null,
                    memberCount: team.members.length,
                    leaderId: team.leaderId.toString(),
                    isLeader: team.leaderId.toString() === session.user.id,
                });
            }
        }

        return { pendingMemberships };
    } catch (error) {
        console.error('Error fetching pending team memberships:', error);
        return { error: 'Failed to fetch pending memberships' };
    }
}

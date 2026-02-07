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
            _id: user._id.toString(), // critical fix for frontend checks
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
        const serialized = registrations.map((reg: any) => {
            // ROBUST OFF-LINE FIX: If the Team is Confirmed (Leader Paid), treat member as Confirmed
            // This handles cases where individual member status update lagged or isn't required (Offline model)
            const isTeamConfirmed = reg.teamId && reg.teamId.status === 'CONFIRMED';
            const effectiveStatus = isTeamConfirmed ? 'CONFIRMED' : reg.status;

            return {
                _id: reg._id.toString(),
                status: effectiveStatus,
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
                    isFull: reg.teamId.members.length >= (reg.eventId.maxTeamSize || 1),
                    status: reg.teamId.status
                } : null,
            };
        });

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

// DELETE USER ACTION (Admin Only)
export async function deleteUserAction(userId: string) {
    const session = await getSession();
    const role = session?.role?.toUpperCase();
    if (!session || (role !== 'SUPER_ADMIN' && role !== 'CLUB_ADMIN')) {
        return { error: 'Unauthorized: Only Admins can delete users.' };
    }

    try {
        await connectToDatabase();
        // Dynamic imports for models
        const User = (await import('@/models/User')).default;
        const Registration = (await import('@/models/Registration')).default;
        const Team = (await import('@/models/Team')).default;
        const Slot = (await import('@/models/Slot')).default;
        const mongoose = (await import('mongoose')).default;

        const userToDelete = await User.findById(userId);
        if (!userToDelete) return { error: 'User not found' };

        console.log(`[DELETE USER] Starting deletion for user: ${userToDelete.email} (${userId})`);

        // 1. Handle Teams
        // A. Teams where user is LEADER -> Dissolve Team
        const ledTeams = await Team.find({ leaderId: userId });
        for (const team of ledTeams) {
            console.log(`[DELETE USER] Dissolving team ${team.name} led by user.`);

            // Cancel registrations for ALL members
            const memberRegs = await Registration.find({ teamId: team._id });
            for (const reg of memberRegs) {
                // Restore Slot Capacity
                if (reg.slotId) {
                    await Slot.findByIdAndUpdate(reg.slotId, { $inc: { registeredCount: -1 } });
                }
                await Registration.findByIdAndDelete(reg._id);
            }

            // Restore Team Slot Capacity
            if (team.slotId) {
                await Slot.findByIdAndUpdate(team.slotId, { $inc: { teamsCount: -1 } });
            }

            // Delete Team
            await Team.findByIdAndDelete(team._id);
        }

        // B. Teams where user is MEMBER (but not leader) -> Remove from Team
        const memberTeams = await Team.find({ 'members.userId': userId, leaderId: { $ne: userId } });
        for (const team of memberTeams) {
            console.log(`[DELETE USER] Removing user from team ${team.name}.`);
            await Team.findByIdAndUpdate(team._id, {
                $pull: { members: { userId: userId } }
            });
        }

        // 2. Handle Individual Registrations (Solo or where logical links might remain)
        // (Note: The team logic above handled registrations linked to teams led by this user. 
        // We still need to catch any other registrations this user has, e.g. solo events or member registrations 
        // if they weren't caught above - though member logic usually implies a registration exists)

        const userRegs = await Registration.find({ userId: userId });
        for (const reg of userRegs) {
            console.log(`[DELETE USER] Deleting registration ${reg._id} for event ${reg.eventId}`);
            // Restore Slot Capacity (if not already done by team logic)
            // Safety check: verify if slot exists and decrement only if we haven't already processed this reg via ledTeams loop
            // Since we deleted ledTeam regs above, find() won't return them if we await correctly.
            // But to be safe, we just process what's left.
            if (reg.slotId) {
                await Slot.findByIdAndUpdate(reg.slotId, { $inc: { registeredCount: -1 } });
            }
            await Registration.findByIdAndDelete(reg._id);
        }

        // 3. Delete User Code/Payment Metadata (If any custom schemas exist - assuming none for now)

        // 4. Delete User
        await User.findByIdAndDelete(userId);
        console.log(`[DELETE USER] User ${userId} deleted successfully.`);

        // Revalidate
        // Using dynamic import for revalidatePath to avoid edge runtime issues if any
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/students');
        revalidatePath('/club/students');

        return { success: true, message: `User ${userToDelete.name} deleted permanently.` };

    } catch (error) {
        console.error('Delete User Error:', error);
        return { error: 'Failed to delete user' };
    }
}

'use server';

import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Team from '@/models/Team';
import Registration, { RegStatus } from '@/models/Registration';
import User from '@/models/User';

export async function getUserManagedTeamsAction() {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        await connectToDatabase();
        // Ensure models are loaded
        (await import('@/models/User')).default;
        (await import('@/models/Event')).default;

        const teams = await Team.find({
            leaderId: session.user.id,
            status: { $ne: 'CANCELLED' }
        })
            .populate('eventId', 'name maxMembers minTeamSize maxTeamSize price type id')
            .populate({
                path: 'members.userId',
                model: 'User',
                select: 'name email rollNumber' // Corrected: select name, not fullName
            })
            .lean();

        const enhancedTeams = teams.map((team: any) => {
            // @ts-ignore
            const membersWithDetails = (team.members || []).map((m: any) => {
                // In lean mode, if populated, userId is the user object.
                // If not found, it might be null or the original ID depending on mongoose settings.
                const user = m.userId;
                // Check for 'name' property instead of 'fullName'
                const isPopulated = user && typeof user === 'object' && 'name' in user;

                // Safely extract the ID string
                let userIdString = 'unknown';
                if (isPopulated && user._id) userIdString = user._id.toString();
                else if (user && typeof user === 'string') userIdString = user;
                else if (user && user._id) userIdString = user._id.toString();

                return {
                    _id: m._id ? m._id.toString() : null,
                    // If populated, user._id is the ID. If not, m.userId might be the ID.
                    userId: userIdString,
                    status: m.status,
                    paymentStatus: m.paymentStatus,
                    joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString() : null,
                    fullName: isPopulated ? user.name : 'Unknown User', // Map user.name to fullName
                    email: isPopulated ? user.email : '',
                    rollNumber: isPopulated ? user.rollNumber : ''
                };
            });

            return {
                ...team,
                _id: team._id.toString(),
                eventId: team.eventId ? { ...team.eventId, _id: team.eventId._id.toString() } : null,
                slotId: team.slotId ? team.slotId.toString() : null,
                leaderId: team.leaderId.toString(),
                members: membersWithDetails,
                createdAt: team.createdAt ? new Date(team.createdAt).toISOString() : null,
                updatedAt: team.updatedAt ? new Date(team.updatedAt).toISOString() : null,
                expiresAt: team.expiresAt ? new Date(team.expiresAt).toISOString() : null,
            };
        });

        return { success: true, teams: enhancedTeams };

    } catch (error: any) {
        console.error('Fetch Teams Error:', error);
        return { error: 'Failed to fetch teams' };
    }
}

export async function removeTeamMemberAction(teamId: string, memberId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        await connectToDatabase();

        const team = await Team.findById(teamId);
        if (!team) return { error: 'Team not found' };

        if (team.leaderId.toString() !== session.user.id) {
            return { error: 'Only the Team Leader can remove members.' };
        }

        // Prevent removal if Team is Confirmed/Paid
        if (team.status === 'CONFIRMED') {
            return { error: 'Cannot remove members after payment is accepted. Contact Admin for changes.' };
        }

        if (memberId === session.user.id) {
            return { error: 'You cannot remove yourself. Delete the team instead (Contact Admin).' };
        }

        // Remove from members array
        team.members = team.members.filter((m: any) => m.userId.toString() !== memberId);
        await team.save();

        // DELETE Registration completely
        // Use eventId + userId to be 100% sure we catch the right registration even if teamId link was flaky
        await Registration.findOneAndDelete({ userId: memberId, eventId: team.eventId });

        return { success: true };
    } catch (error: any) {
        console.error('Remove Member Error:', error);
        return { error: 'Failed to remove member' };
    }
}

export async function deleteTeamAction(teamId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'You must be logged in.' };

        await connectToDatabase();

        const team = await Team.findById(teamId);
        if (!team) return { error: 'Team not found in database.' };

        if (team.leaderId.toString() !== session.user.id) {
            return { error: `Unauthorized: You (Leader ID: ${team.leaderId}) are not the leader.` };
        }

        if (team.status === 'CONFIRMED') {
            return { error: 'Cannot delete a confirmed/paid team. Please contact admin.' };
        }

        // 1. Mark Team as Cancelled
        team.status = 'CANCELLED';
        await team.save();

        // 2. Decrement TEAMS count from slot
        if (team.slotId) {
            const Slot = (await import('@/models/Slot')).default;
            await Slot.findByIdAndUpdate(team.slotId, { $inc: { teamsCount: -1 } });
        }

        // 3. Cancel ALL registrations for this team
        const memberRegs = await Registration.find({ teamId: team._id, status: { $ne: RegStatus.CANCELLED } });

        for (const memberReg of memberRegs) {
            memberReg.status = RegStatus.CANCELLED;
            await memberReg.save();
            // Also decrement registeredCount for each member
            if (memberReg.slotId) {
                const Slot = (await import('@/models/Slot')).default;
                await Slot.findByIdAndUpdate(memberReg.slotId, { $inc: { registeredCount: -1 } });
            }
        }

        return { success: true };

    } catch (error: any) {
        console.error('Delete Team Error:', error);
        return { error: `Deletion Failed: ${error.message}` };
    }
}

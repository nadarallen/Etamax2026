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
        const Slot = (await import('@/models/Slot')).default; // Capture model

        const teams = await Team.find({
            $or: [
                { leaderId: session.user.id },
                { 'members.userId': session.user.id }
            ],
            status: { $ne: 'CANCELLED' }
        })
            .populate('eventId', 'name maxMembers minTeamSize maxTeamSize price type id')
            .populate({ path: 'slotId', model: Slot, select: 'startTime endTime dayNumber venue' }) // Explicit model
            .populate({
                path: 'members.userId',
                model: 'User',
                select: 'name email rollNumber' // Corrected: select name, not fullName
            })
            .lean();

        console.log("Fetched Teams (Raw):", JSON.stringify(teams, null, 2));

        // Deduplicate teams by _id
        const uniqueTeamsMap = new Map();
        teams.forEach((t: any) => uniqueTeamsMap.set(t._id.toString(), t));
        const uniqueTeams = Array.from(uniqueTeamsMap.values());

        const enhancedTeams = uniqueTeams.map((team: any) => {
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

            const isLeader = team.leaderId.toString() === session.user.id;

            // Strict Slot Serialization to avoid Buffer/Uint8Array issues
            let safeSlotId = null;
            if (team.slotId) {
                safeSlotId = {
                    _id: team.slotId._id ? team.slotId._id.toString() : null,
                    dayNumber: Number(team.slotId.dayNumber) || 1, // Ensure number
                    startTime: String(team.slotId.startTime || ''),
                    endTime: String(team.slotId.endTime || ''),
                    venue: String(team.slotId.venue || '')
                };
            }

            return {
                ...team,
                _id: team._id.toString(),
                eventId: team.eventId ? { ...team.eventId, _id: team.eventId._id.toString() } : null,
                slotId: safeSlotId,
                leaderId: team.leaderId.toString(),
                members: membersWithDetails,
                isLeader, // Added flag
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
        team.status = 'CANCELLED' as any;
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

/**
 * Simplified Team Join Action
 * Allows users to join a team with just a team code
 * Auto-inherits leader's slot and uses user's profile data
 */
export async function joinTeamDirectAction(eventId: string, teamCode: string) {
    try {
        const session = await getSession();
        if (!session || !session.user.id) {
            return { error: 'You must be logged in to join a team.' };
        }

        await connectToDatabase();

        // 1. Validate Team Code
        const team = await Team.findOne({ code: teamCode.toUpperCase().trim() })
            .populate('members.userId');

        if (!team) {
            return { error: 'Invalid team code. Please check and try again.' };
        }

        // 2. Verify Team is for this Event
        if (team.eventId.toString() !== eventId) {
            return { error: 'This team code is for a different event.' };
        }

        // 3. Check if User Already in Team
        const alreadyMember = team.members.some((m: any) =>
            m.userId._id.toString() === session.user.id
        );
        if (alreadyMember) {
            return { error: 'You are already a member of this team.' };
        }

        // 4. Check Team Capacity
        const Event = (await import('@/models/Event')).default;
        const event = await Event.findById(eventId);
        if (!event) {
            return { error: 'Event not found.' };
        }

        const maxSize = event.maxTeamSize || event.minTeamSize || 4;
        if (team.members.length >= maxSize) {
            return { error: `Team is full (max ${maxSize} members).` };
        }

        // 5. Get User Profile
        const user = await User.findById(session.user.id);
        if (!user) {
            return { error: 'User profile not found.' };
        }

        // 6. Find Leader's Registration to Inherit Slot
        const leaderReg = await Registration.findOne({
            userId: team.leaderId,
            eventId: eventId,
            teamId: team._id
        });

        if (!leaderReg || !leaderReg.slotId) {
            return { error: 'Team leader has not selected a slot yet. Please ask the leader to complete registration first.' };
        }

        // 7. Add User to Team
        const mongoose = await import('mongoose');
        team.members.push({
            userId: new mongoose.default.Types.ObjectId(session.user.id) as any,
            status: 'JOINED' as any,
            paymentStatus: 'PENDING' as any,
            joinedAt: new Date()
        });
        await team.save();

        // 8. Check if Leader Has Paid
        const leader = team.members.find((m: any) =>
            m.userId._id.toString() === team.leaderId.toString()
        );
        const isLeaderPaid = leader?.paymentStatus === 'PAID';

        // 9. Create Registration if Leader Already Paid
        if (isLeaderPaid) {
            const { customAlphabet } = await import('nanoid');
            const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
            const etamaxId = `ETAMAX-${nanoid()}`;

            await Registration.create({
                userId: user._id,
                eventId: eventId,
                teamId: team._id,
                slotId: leaderReg.slotId, // Inherit leader's slot
                paymentId: leaderReg.paymentId, // Same payment as leader
                status: RegStatus.CONFIRMED,
                qrCodeHash: require('crypto').randomBytes(16).toString('hex'),
                etamaxId: etamaxId,
                fullName: user.name,
                rollNumber: user.rollNumber || 'N/A',
                email: user.email,
                branch: user.branch || 'N/A',
                semester: user.semester || 'N/A',
                emailSent: false,
                paymentMethod: 'FREE' // Member doesn't pay
            });

            const { revalidatePath } = await import('next/cache');
            revalidatePath('/profile');
            return {
                success: true,
                message: `Successfully joined team "${team.name}"! Your registration is confirmed.`,
                teamName: team.name,
                confirmed: true
            };
        } else {
            // Leader hasn't paid yet - create PENDING registration
            const { customAlphabet } = await import('nanoid');
            const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
            const etamaxId = `ETAMAX-${nanoid()}`;

            await Registration.create({
                userId: user._id,
                eventId: eventId,
                teamId: team._id,
                slotId: leaderReg.slotId, // Inherit leader's slot
                paymentId: null, // No payment yet
                status: RegStatus.PENDING, // Pending until leader pays
                qrCodeHash: require('crypto').randomBytes(16).toString('hex'),
                etamaxId: etamaxId,
                fullName: user.name,
                rollNumber: user.rollNumber || 'N/A',
                email: user.email,
                branch: user.branch || 'N/A',
                semester: user.semester || 'N/A',
                emailSent: false,
                paymentMethod: 'FREE' // Member doesn't pay
            });

            const { revalidatePath } = await import('next/cache');
            revalidatePath('/profile');
            return {
                success: true,
                message: `Successfully joined team "${team.name}"! Your registration will be confirmed once the team leader completes payment.`,
                teamName: team.name,
                confirmed: false
            };
        }

    } catch (error) {
        console.error('Join Team Direct Error:', error);
        return { error: 'Failed to join team. Please try again.' };
    }
}


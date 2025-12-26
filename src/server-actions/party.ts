'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import Team, { TeamStatus, MemberStatus, PaymentStatus } from '@/models/Team';
import Event from '@/models/Event';
import { getSession } from '@/lib/auth';
import { randomBytes } from 'crypto';

// Prompt 11: Create Party Logic
export async function createPartyAction(eventId: string, slotId: string, teamName?: string) {
    // 1. Auth Check
    const session = await getSession();
    if (!session || !session.userId) {
        return { error: "Unauthorized" };
    }

    try {
        await connectToDatabase();

        // 2. Validation (Check if Event/Slot exists)
        // In strict mode we could check slot capacity here too, but per Prompt 14 we are "Tentative"
        const event = await Event.findById(eventId);
        if (!event) return { error: "Event not found" };

        // 3. Generate Code
        const code = randomBytes(3).toString('hex').toUpperCase(); // 6 chars

        // 4. Create Team
        const newTeam = await Team.create({
            name: teamName || `Team ${code}`, // Use provided name or Default
            code: code,
            eventId: eventId,
            slotId: slotId,
            leaderId: session.userId,
            members: [{
                userId: session.userId,
                status: MemberStatus.JOINED, // Leader is auto-joined
                paymentStatus: PaymentStatus.PENDING,
                joinedAt: new Date()
            }],
            status: TeamStatus.OPEN,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 Hour TTL (Prompt 15)
        });

        return { success: true, partyId: newTeam._id.toString() };

    } catch (error) {
        console.error("Create Party Error:", error);
        return { error: "Failed to create party" };
    }
}

// Prompt 12: Join Party Logic
export async function joinPartyAction(code: string) {
    const session = await getSession();
    if (!session || !session.userId) return { error: "Unauthorized" };

    try {
        await connectToDatabase();

        // 1. Lookup
        const team = await Team.findOne({ code, status: TeamStatus.OPEN }).populate('eventId');
        if (!team) return { error: "Invalid or expired code" };

        // 2. Validate
        const isMember = team.members.find((m: any) => m.userId.toString() === session.userId);
        if (isMember) {
            return { success: true, partyId: team._id.toString() };
        }

        if (team.members.length >= (team.eventId as any).maxTeamSize) {
            return { error: "Team is full" };
        }

        // 3. Update
        team.members.push({
            userId: session.userId as any,
            status: MemberStatus.JOINED,
            paymentStatus: PaymentStatus.PENDING,
            joinedAt: new Date()
        });

        await team.save();

        return { success: true, partyId: team._id.toString() };

    } catch (error) {
        console.error("Join Party Error:", error);
        return { error: "Failed to join party" };
    }
}

export async function getPartyDetails(partyId: string) {
    await connectToDatabase();
    const team = await Team.findById(partyId)
        .populate('leaderId', 'name email')
        .populate({
            path: 'members.userId',
            select: 'name email'
        })
        .populate('eventId');

    if (!team) return null;
    return JSON.parse(JSON.stringify(team));
}

// Prompt 16: User Team Management
export async function leavePartyAction(partyId: string) {
    const session = await getSession();
    if (!session?.userId) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        const team = await Team.findById(partyId);
        if (!team) return { error: "Team not found" };

        // Prevent leaving if paid or if leader (unless dynamic leader assignment is built, which is out of scope for now)
        const member = team.members.find((m: any) => m.userId.toString() === session.userId);
        if (!member) return { error: "Not a member" };

        if (member.paymentStatus === PaymentStatus.PAID) {
            return { error: "Cannot leave after payment. Contact support." };
        }

        if (team.leaderId.toString() === session.userId) {
            return { error: "Leader cannot leave. Delete the team instead." };
        }

        // Remove member
        team.members = team.members.filter((m: any) => m.userId.toString() !== session.userId);
        await team.save();

        return { success: true };
    } catch (error) {
        console.error("Leave Party Error", error);
        return { error: "Failed to leave party" };
    }
}

export async function kickMemberAction(partyId: string, memberId: string) {
    const session = await getSession();
    if (!session?.userId) return { error: "Unauthorized" };

    try {
        await connectToDatabase();
        const team = await Team.findById(partyId);
        if (!team) return { error: "Team not found" };

        // Check Leadership
        if (team.leaderId.toString() !== session.userId) return { error: "Only leader can kick members" };

        const member = team.members.find((m: any) => m.userId.toString() === memberId);
        if (!member) return { error: "Member not found" };

        if (member.paymentStatus === PaymentStatus.PAID) {
            return { error: "Cannot kick paid member" };
        }

        team.members = team.members.filter((m: any) => m.userId.toString() !== memberId);
        await team.save();
        revalidatePath(`/student/party/${partyId}`);
        return { success: true };

    } catch (error) {
        return { error: "Failed to kick member" };
    }
}

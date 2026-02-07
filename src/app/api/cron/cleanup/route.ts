
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Registration, { RegStatus } from '@/models/Registration';
import Team, { TeamStatus } from '@/models/Team';
import Slot from '@/models/Slot';

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET(request: Request) {
    // 0. Verify Authorization (CRON_SECRET) to prevent public abuse
    // Vercel Cron sends specific header, or we can use a query param secret
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Fallback: Check query param for manual trigger convenience
        const url = new URL(request.url);
        const key = url.searchParams.get('key');
        if (key !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        await connectToDatabase();

        // 1. Define Expiration Threshold (1 Hour ago)
        const expirationTime = new Date(Date.now() - 60 * 60 * 1000);

        console.log(`[Cleanup Cron] Starting cleanup for registrations older than ${expirationTime.toISOString()}`);

        // 2. Find Pending Registrations older than threshold
        // Status PENDING means they haven't paid.
        const pendingRegs = await Registration.find({
            status: RegStatus.PENDING,
            createdAt: { $lt: expirationTime }
        }).populate('slotId');

        let cleanedUpCount = 0;
        let cancelledTeams = new Set<string>();

        for (const reg of pendingRegs) {

            // Skip if already handled via team cancellation
            if (reg.teamId && cancelledTeams.has(reg.teamId.toString())) {
                reg.status = RegStatus.CANCELLED;
                await reg.save();
                continue;
            }

            // Is this part of a Team?
            if (reg.teamId) {
                const team = await Team.findById(reg.teamId);

                // If Team exists and is not confirmed (OPEN means unpaid)
                if (team && team.status !== TeamStatus.CONFIRMED) {

                    // Case: Team Leader Expired -> Cancel Whole Team
                    if (team.leaderId.toString() === reg.userId.toString()) {
                        console.log(`[Cleanup] Team Leader ${reg.userId} expired. Cancelling team ${team._id}`);

                        // Decrement Slot Count for Team (teamsCount)
                        if (reg.slotId) {
                            await Slot.findByIdAndUpdate(reg.slotId._id, { $inc: { teamsCount: -1 } });
                        }

                        // Mark all members as Cancelled
                        await Registration.updateMany(
                            { teamId: team._id },
                            { status: RegStatus.CANCELLED }
                        );

                        // Update Team Status
                        team.status = 'CANCELLED' as any;
                        await team.save();
                        cancelledTeams.add(team._id.toString());
                        cleanedUpCount += team.members.length;
                    }
                    // Case: Member Expired (but Leader still active?)
                    // Logic: If member didn't pay for themselves? 
                    // Usually leader pays for all. If logic allows split usage?
                    // "Member joined but leader hasn't paid" -> They expire when LEADER expires.
                    // If member creation date is old but leader created team recently?
                    // Safe approach: Only kill member if they are basically irrelevant or logic dictates.
                    // For now, we rely on Leader Expiration to kill the group.
                }

            } else {
                // Solo Registration
                console.log(`[Cleanup] Solo User ${reg.userId} expired. Releasing slot.`);

                // Decrement Slot Count
                if (reg.slotId) {
                    await Slot.findByIdAndUpdate(reg.slotId._id, { $inc: { registeredCount: -1 } });
                }

                reg.status = RegStatus.CANCELLED;
                await reg.save();
                cleanedUpCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cleanup Complete. Processed ${cleanedUpCount} expired registrations.`
        });

    } catch (error: any) {
        console.error("[Cleanup Cron] Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Team, { TeamStatus } from '@/models/Team';
import Event from '@/models/Event';

export async function GET(req: NextRequest) {
    // 1. Auth Check (Secure Cron)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow Vercel Cron signature check in production or custom secret
        // For development/demo, we might skip or use simple secret
        if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        await connectToDatabase();

        // 2. Find Expired Open Teams
        const expiredTeams = await Team.find({
            status: TeamStatus.OPEN,
            expiresAt: { $lt: new Date() }
        });

        const results = {
            expired: expiredTeams.length,
            errors: 0
        };

        // 3. Process Expiry
        for (const team of expiredTeams) {
            try {
                // Return Logic:
                // Teams hold slots softly? 
                // In our schema, we only increment 'bookedCount' on Payment Success (CONFIRMED).
                // So OPEN teams don't actually hold 'bookedCount' in the Event model yet, 
                // UNLESS we implemented a hold mechanism. 
                // Prompt 14 said "Concurrency & Locking".
                // If we didn't implement sophisticated locking, we just mark team as EXPIRED so they can't pay.

                team.status = TeamStatus.EXPIRED;
                await team.save();

            } catch (e) {
                console.error(`Failed to expire team ${team._id}`, e);
                results.errors++;
            }
        }

        return NextResponse.json({ success: true, ...results });

    } catch (error) {
        console.error("Cron Error", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

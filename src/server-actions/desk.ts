'use server';

import { getSession, Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Registration, { RegStatus } from '@/models/Registration';
import User from '@/models/User';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import { updateRegistrationStatusAction } from './registration';

// Desk Search Action
export async function searchDeskRegistrationsAction(query: string) {
    try {
        const session = await getSession();
        console.log("Desk Search Session:", session?.user?.email, session?.role);

        // Loose Role Check
        const role = session?.role?.toUpperCase();
        if (!session || (role !== 'SUPER_ADMIN' && role !== 'CLUB_ADMIN')) {
            console.error("Desk Unauthorized:", session?.role);
            return { error: 'Unauthorized: Desk Access Required' };
        }

        await connectToDatabase();

        // Ensure models are registered
        (await import('@/models/Event')).default;
        (await import('@/models/Slot')).default;
        (await import('@/models/User')).default;

        let filter: any = {};

        // Search Logic
        if (query && query.trim().length > 0) {
            const regex = new RegExp(query.trim(), 'i');
            filter.$or = [
                { fullName: regex },
                { rollNumber: regex },
                { email: regex },
                { etamaxId: regex }
            ];
        }

        // Default: Show ALL relevant to query, frontend can filter PENDING/CONFIRMED
        // But for performance, if query is empty, maybe return nothing or just recent pending?
        // Let's return recent pending offline if query is empty
        if (!query || query.trim().length === 0) {
            filter.status = RegStatus.PENDING;
            filter.paymentMethod = 'OFFLINE';
        }

        const registrations = await Registration.find(filter)
            .sort({ createdAt: -1 })
            .limit(50) // Limit results
            .limit(50) // Limit results
            .populate({ path: 'eventId', model: Event })
            .populate({ path: 'slotId', model: Slot })
            .lean();

        // Serialize results
        const serialized = registrations.map(reg => ({
            _id: reg._id.toString(),
            fullName: reg.fullName,
            rollNumber: reg.rollNumber,
            email: reg.email,
            branch: reg.branch,
            semester: reg.semester,
            status: reg.status,
            paymentMethod: reg.paymentMethod,
            etamaxId: reg.etamaxId,
            eventId: reg.eventId ? {
                // @ts-ignore
                name: reg.eventId.name,
                // @ts-ignore
                price: reg.eventId.price,
                // @ts-ignore
                _id: reg.eventId._id.toString()
            } : null,
            slotId: reg.slotId ? {
                // @ts-ignore
                startTime: reg.slotId.startTime,
                // @ts-ignore
                endTime: reg.slotId.endTime,
                // @ts-ignore
                venue: reg.slotId.venue,
                // @ts-ignore
                dayNumber: reg.slotId.dayNumber,
                // @ts-ignore
                _id: reg.slotId._id.toString()
            } : null,
            createdAt: reg.createdAt.toISOString()
        }));

        return { success: true, registrations: serialized };

    } catch (error) {
        console.error("Desk Search Error:", error);
        return { error: 'Failed to search registrations' };
    }
}

// Desk Confirm Action (Wrapper around update but with tracking)
// Desk Confirm Action (Wrapper around update but with tracking)
export async function confirmDeskPaymentAction(regId: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        // Ensure models
        (await import('@/models/Team')).default;

        // 1. Identify Target (Member -> Leader Logic)
        let targetRegId = regId;
        const initialReg = await Registration.findById(regId).populate('teamId');

        if (!initialReg) return { error: 'Registration not found' };

        // If part of a team, we MUST confirm the Leader to trigger the cascade (Leader Pays All model)
        // Unless we are already the leader
        if (initialReg.teamId) {
            // @ts-ignore
            const leaderId = initialReg.teamId.leaderId.toString();
            if (initialReg.userId.toString() !== leaderId) {
                // Find Leader's Registration for this event
                const leaderReg = await Registration.findOne({
                    eventId: initialReg.eventId,
                    userId: leaderId
                });
                if (leaderReg) {
                    targetRegId = leaderReg._id.toString();
                    console.log(`Redirecting confirmation from Member ${initialReg.fullName} to Leader ${leaderId}`);
                }
            }
        }

        // 2. Call existing update logic (handles team cascade, email) on TARGET
        const result = await updateRegistrationStatusAction(targetRegId, RegStatus.CONFIRMED);

        if (result.success) {
            // 3. Add Audit Log (confirmedBy) to Target
            await Registration.findByIdAndUpdate(targetRegId, {
                confirmedBy: session.user.id,
                confirmedAt: new Date(),
                status: RegStatus.CONFIRMED // Explicitly ensure status is set here too if updateRegistrationStatusAction didn't persist it for some reason (it should, but safety first)
            });

            // 4. Batch Audit Log for Team Members (if applicable)
            if (initialReg.teamId) {
                await Registration.updateMany(
                    { teamId: initialReg.teamId._id },
                    {
                        confirmedBy: session.user.id,
                        confirmedAt: new Date()
                    }
                );
            }

            return { success: true };
        } else {
            return result;
        }

    } catch (error) {
        console.error("Desk Confirm Error:", error);
        return { error: 'Failed to confirm payment' };
    }
}

// --- RAPID PAYMENT FEATURES ---

// 1. Global Student Search (Finds Users, not just registrations)
export async function findGlobalStudentsAction(query: string) {
    try {
        const session = await getSession();
        console.log("Global Search Session:", session?.user?.email, session?.role);

        const role = session?.role?.toUpperCase();
        if (!session || (role !== 'SUPER_ADMIN' && role !== 'CLUB_ADMIN')) {
            return { error: 'Unauthorized' };
        }

        if (!query || query.trim().length < 2) return { success: true, students: [] };

        await connectToDatabase();
        (await import('@/models/User')).default;

        const regex = new RegExp(query.trim(), 'i');
        const students = await User.find({
            $or: [
                { fullName: regex },
                { rollNumber: regex },
                { email: regex }
            ]
        })
            .select('_id fullName rollNumber email branch semester')
            .limit(10)
            .lean();

        const serialized = students.map(s => ({
            _id: s._id.toString(),
            fullName: s.fullName,
            rollNumber: s.rollNumber,
            email: s.email,
            branch: s.branch,
            semester: s.semester
        }));

        return { success: true, students: serialized };

    } catch (error) {
        console.error("Global Student Search Error:", error);
        return { error: 'Search failed' };
    }
}

// 2. Get Student Full Details (All Registrations)
export async function getStudentFullDetailsAction(userId: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        await connectToDatabase();
        // Dynamic imports to ensure Models are registered
        const Event = (await import('@/models/Event')).default;
        const Slot = (await import('@/models/Slot')).default;
        const Team = (await import('@/models/Team')).default;
        const User = (await import('@/models/User')).default;

        const registrations = await Registration.find({ userId })
            .sort({ createdAt: -1 })
            .sort({ createdAt: -1 })
            .populate({ path: 'eventId', model: Event })
            .populate({ path: 'slotId', model: Slot })
            .populate({
                path: 'teamId',
                model: Team,
                populate: { path: 'members.userId', model: User, select: 'fullName' }
            })
            .lean();

        const serialized = registrations.map(reg => ({
            _id: reg._id.toString(),
            status: reg.status,
            paymentMethod: reg.paymentMethod,
            eventId: reg.eventId ? {
                // @ts-ignore
                name: reg.eventId.name,
                // @ts-ignore
                price: reg.eventId.price,
                // @ts-ignore
                type: reg.eventId.type,
            } : null,
            slotId: reg.slotId ? {
                // @ts-ignore
                venue: reg.slotId.venue,
                // @ts-ignore
                startTime: reg.slotId.startTime,
                // @ts-ignore
                endTime: reg.slotId.endTime,
                // @ts-ignore
                dayNumber: reg.slotId.dayNumber,
            } : null,
            team: reg.teamId ? {
                // @ts-ignore
                name: reg.teamId.name,
                // @ts-ignore
                leaderId: reg.teamId.leaderId.toString(),
                // @ts-ignore
                members: reg.teamId.members.map((m: any) => ({
                    name: m.userId.fullName,
                    status: m.status
                }))
            } : null
        }));

        return { success: true, registrations: serialized };

    } catch (error) {
        console.error("Student Details Fetch Error:", error);
        return { error: 'Failed to fetch student details' };
    }
}

// 3. Batch Approve Action
export async function approveBatchRegistrationsAction(regIds: string[]) {
    try {
        const session = await getSession();
        const role = session?.role?.toUpperCase();
        if (!session || (role !== 'SUPER_ADMIN' && role !== 'CLUB_ADMIN')) {
            return { error: 'Unauthorized' };
        }

        if (!regIds || regIds.length === 0) return { error: 'No registrations selected' };

        await connectToDatabase();

        let successCount = 0;
        let errors = [];

        // We reuse confirmDeskPaymentAction to ensure all side-effects (Leader redirect, Email, Audit) ran
        const results = await Promise.all(regIds.map(id => confirmDeskPaymentAction(id)));

        results.forEach(res => {
            if (res.success) successCount++;
            else errors.push(res.error);
        });

        return {
            success: true,
            count: successCount,
            message: `Successfully approved ${successCount} registrations.`
        };

    } catch (error) {
        console.error("Batch Approve Error:", error);
        return { error: 'Batch approval failed' };
    }
}

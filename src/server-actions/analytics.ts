'use server';

import { getSession, Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Registration from '@/models/Registration';
import Event from '@/models/Event';
import Slot from '@/models/Slot';

export async function getStudentAnalyticsAction() {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        // Ensure models are registered
        const _slot = Slot;
        const _event = Event;

        // 1. Fetch all students
        // We select specific fields to optimize
        const students = await User.find({ role: 'STUDENT' })
            .select('name email rollNumber branch semester role')
            .lean();

        // 2. Fetch all registrations with Event details
        // We fetch ALL registrations to map them to students locally to avoid N+1 queries
        const registrations = await Registration.find({ status: { $ne: 'CANCELLED' } })
            .populate({
                path: 'eventId',
                select: 'name type category'
            })
            .lean();

        // 3. Map registrations to students
        // Create a map of userId -> [registrations]
        const regMap = new Map();
        registrations.forEach((reg: any) => {
            const uId = reg.userId.toString();
            if (!regMap.has(uId)) {
                regMap.set(uId, []);
            }
            if (reg.eventId) {
                regMap.get(uId).push({
                    eventName: reg.eventId.name,
                    category: reg.eventId.category,
                    type: reg.eventId.type,
                    status: reg.status
                });
            }
        });

        // 4. Transform data for the UI
        const analyticsData = students.map((student: any) => {
            const studentRegs = regMap.get(student._id.toString()) || [];

            // Calculate Criteria
            const categories = new Set(studentRegs.map((r: any) => r.category).filter(Boolean));
            const hasTechnical = categories.has('Technical');
            const hasCultural = categories.has('Cultural');
            const hasSeminar = categories.has('Seminar');

            const criteriaMet = hasTechnical && hasCultural && hasSeminar;
            const criteriaCount = [hasTechnical, hasCultural, hasSeminar].filter(Boolean).length;

            return {
                id: student._id.toString(),
                name: student.name,
                email: student.email,
                rollNumber: student.rollNumber || 'N/A',
                branch: student.branch || 'Unknown',
                semester: student.semester || 'N/A',
                registrations: studentRegs,
                criteria: {
                    met: criteriaMet,
                    count: criteriaCount,
                    details: {
                        Technical: hasTechnical,
                        Cultural: hasCultural,
                        Seminar: hasSeminar
                    }
                }
            };
        });

        return {
            data: JSON.parse(JSON.stringify(analyticsData)),
            success: true
        };

    } catch (error) {
        console.error('Analytics Error:', error);
        return { error: 'Failed to fetch student analytics' };
    }
}

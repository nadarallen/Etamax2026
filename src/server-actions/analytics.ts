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

        // 1. Aggregation Pipeline
        const students = await User.aggregate([
            { $match: { role: 'STUDENT' } },
            {
                $lookup: {
                    from: 'registrations',
                    let: { userId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$userId', '$$userId'] }, status: { $ne: 'CANCELLED' } } },
                        {
                            $lookup: {
                                from: 'events',
                                localField: 'eventId',
                                foreignField: '_id',
                                as: 'event'
                            }
                        },
                        { $unwind: '$event' },
                        {
                            $project: {
                                eventName: '$event.name',
                                category: '$event.category',
                                type: '$event.type',
                                status: '$status'
                            }
                        }
                    ],
                    as: 'registrations'
                }
            },
            {
                $project: {
                    id: { $toString: '$_id' },
                    name: 1,
                    email: 1,
                    rollNumber: { $ifNull: ['$rollNumber', 'N/A'] },
                    branch: { $ifNull: ['$branch', 'Unknown'] },
                    semester: { $ifNull: ['$semester', 'N/A'] },
                    registrations: 1,
                    // Calculated fields
                    categories: '$registrations.category'
                }
            },
            { $sort: { rollNumber: 1 } }
        ]);

        // Post-process for criteria (easier in JS than complex aggregation conditionals)
        const analyticsData = students.map((doc: any) => {
            const categories = new Set(doc.categories);
            const hasTechnical = categories.has('Technical');
            const hasCultural = categories.has('Cultural');
            const hasSeminar = categories.has('Seminar');

            const criteriaMet = hasTechnical && hasCultural && hasSeminar;
            const criteriaCount = [hasTechnical, hasCultural, hasSeminar].filter(Boolean).length;

            return {
                id: doc.id,
                name: doc.name,
                email: doc.email,
                rollNumber: doc.rollNumber,
                branch: doc.branch,
                semester: doc.semester,
                registrations: doc.registrations,
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

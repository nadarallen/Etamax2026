'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getSession, Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import { revalidatePath, unstable_cache } from 'next/cache';

// --- Validation Schemas ---

const EventSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Name is required'),
    type: z.enum(['solo', 'duo', 'group']),
    club: z.string().min(2, 'Club name is required'),
    category: z.string().min(2, 'Category is required'),
    maxMembers: z.coerce.number().min(1),
    price: z.coerce.number().min(0),
    prizePool: z.string().optional(),
    description: z.string(),
    whatsappLink: z.string().optional(), // Added
});

const SlotSchema = z.object({
    dayNumber: z.coerce.number().min(1).max(3),
    startTime: z.string().min(1, 'Start time required'),
    endTime: z.string().min(1, 'End time required'),
    venue: z.string().min(1, 'Venue required'),
    maxCapacity: z.coerce.number().min(1),
});

export type EventState = {
    error?: string;
    success?: boolean;
    eventId?: string; // Return ID to redirect
};

// --- Event Actions ---

export async function createEventAction(prevState: EventState, formData: FormData): Promise<EventState> {
    try {
        console.log("Create Event Action Started");
        const session = await getSession();
        console.log("Session:", session ? "Found" : "Missing", session?.user?.email, session?.role);

        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            console.error("Unauthorized Access attempt");
            return { error: 'Unauthorized: Only Admins can create events.' };
        }

        const data = Object.fromEntries(formData);
        console.log("Form Data Received:", JSON.stringify(data, null, 2));

        const parsed = EventSchema.safeParse(data);

        if (!parsed.success) {
            console.error("Validation Failed:", parsed.error);
            return { error: (parsed.error as any).errors[0].message };
        }

        const {
            name, type, club, category, maxMembers, price, prizePool, description, whatsappLink
        } = parsed.data;

        // Auto-generate ID if not provided
        let { id } = parsed.data;
        if (!id) {
            const { nanoid } = await import('nanoid');
            const slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
                .replace(/^-+|-+$/g, ''); // Trim hyphens

            // Append random string to ensure uniqueness
            id = `${slug}-${nanoid(4)}`;
        }

        await connectToDatabase();
        console.log("DB Connected");

        const existing = await Event.findOne({ id });
        if (existing) {
            console.warn("Event ID conflict:", id);
            return { error: 'An event with this ID already exists.' };
        }

        const newEvent = await Event.create({
            id,
            name,
            type,
            club,
            category,
            maxMembers,
            price,
            prizePool,
            description,
            whatsappLink, // Added
            isPublished: true
        });

        console.log("Event Created:", newEvent._id);

        // We do revalidate, and the client will handle the redirect
        revalidatePath('/events');
        return { success: true, eventId: newEvent._id.toString() };

    } catch (error) {
        console.error('Create Event Error:', error);
        return { error: (error as Error).message || 'Internal Server Error' };
    }
}

// ... (other imports)

// Optimized internal data fetcher
const getEventsCached = unstable_cache(
    async () => {
        await connectToDatabase();
        const Registration = (await import('@/models/Registration')).default;

        // 1. Fetch All Events
        const events = await Event.find({ isPublished: true }).sort({ createdAt: -1 }).lean();

        // 2. Fetch All Slots
        const allSlots = await Slot.find({}).lean();

        // 3a. Aggregate All Registrations by Slot (Member Count)
        const regCounts = await Registration.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $group: { _id: "$slotId", count: { $sum: 1 } } }
        ]);

        // 3b. Aggregate Unique Teams by Event (Team Count)
        const teamCounts = await Registration.aggregate([
            { $match: { status: { $ne: 'CANCELLED' }, teamId: { $exists: true, $ne: null } } },
            { $group: { _id: "$eventId", teams: { $addToSet: "$teamId" } } },
            { $project: { _id: 1, count: { $size: "$teams" } } }
        ]);

        // Create lookup map for efficiency
        const regCountMap = new Map(regCounts.map((r: any) => [r._id.toString(), r.count]));
        const teamCountMap = new Map(teamCounts.map((r: any) => [r._id.toString(), r.count]));

        // 3c. Aggregate Unique Teams by Slot (Slot Team Count) - NEW
        const slotTeamCounts = await Registration.aggregate([
            { $match: { status: { $ne: 'CANCELLED' }, teamId: { $exists: true, $ne: null } } },
            { $group: { _id: "$slotId", teams: { $addToSet: "$teamId" } } },
            { $project: { _id: 1, count: { $size: "$teams" } } }
        ]);
        const slotTeamCountMap = new Map(slotTeamCounts.map((r: any) => [r._id.toString(), r.count]));

        // Process in memory
        const eventsWithStats = events.map((ev: any) => {
            const evSlots = allSlots.filter((s: any) => s.eventId.toString() === ev._id.toString());

            const slotsWithCounts = evSlots.map((slot: any) => ({
                ...slot,
                registeredCount: regCountMap.get(slot._id.toString()) || 0,
                teamsCount: slotTeamCountMap.get(slot._id.toString()) || 0 // Added
            }));

            const totalCapacity = slotsWithCounts.reduce((acc: number, s: any) => acc + s.maxCapacity, 0);
            const totalRegistered = slotsWithCounts.reduce((acc: number, s: any) => acc + s.registeredCount, 0);
            const totalTeams = teamCountMap.get(ev._id.toString()) || 0;
            const activeDays = [...new Set(slotsWithCounts.map((s: any) => s.dayNumber))];

            return {
                ...ev,
                stats: {
                    totalCapacity,
                    totalRegistered,
                    totalTeams, // Added
                    slotsCount: slotsWithCounts.length
                },
                activeDays,
                slots: slotsWithCounts
            };
        });

        return eventsWithStats;
    },
    ['events-list-public'], // Cache Key
    { revalidate: 60, tags: ['events'] } // Revalidate every 60s or on demand
);

export async function getEventsAction() {
    try {
        const events = await getEventsCached();
        return JSON.parse(JSON.stringify(events));
    } catch (error) {
        console.error('Fetch Events Error:', error);
        return [];
    }
}

export async function getEventRegistrationsAction(eventId: string, page: number = 1, limit: number = 50) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        const Registration = (await import('@/models/Registration')).default;
        // Ensure Slot and Team are registered for populate to work
        (await import('@/models/Slot')).default;
        (await import('@/models/Team')).default;

        const skip = (page - 1) * limit;

        // Parallel fetch: Data + Count
        const [registrations, total] = await Promise.all([
            Registration.find({ eventId })
                .populate('slotId')
                .populate('teamId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Registration.countDocuments({ eventId })
        ]);

        return {
            registrations: JSON.parse(JSON.stringify(registrations)),
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page,
                limit
            },
            success: true
        };
    } catch (error) {
        console.error('Fetch Registrations Error:', error);
        return { error: 'Failed to fetch registrations' };
    }
}

export async function deleteEventAction(eventId: string): Promise<EventState> {
    try {
        const session = await getSession();
        // Allow Super Admin and Club Admin
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized: Only Admins can delete events.' };
        }

        await connectToDatabase();
        // Delete Event and its Slots
        await Event.findByIdAndDelete(eventId);
        await Slot.deleteMany({ eventId });

        revalidatePath('/events');
        revalidatePath('/admin');
        revalidatePath('/club');

        return { success: true };
    } catch (error) {
        console.error('Delete Event Error:', error);
        return { error: 'Failed to delete event' };
    }
}

// ... existing actions ...

export async function getEventByIdAction(eventId: string) {
    try {
        await connectToDatabase();
        if (!eventId) return null;

        // Try searching by _id (if it looks like an ObjectId) or custom id (slug)
        let event;
        if (eventId.match(/^[0-9a-fA-F]{24}$/)) {
            event = await Event.findById(eventId).lean();
        }

        if (!event) {
            event = await Event.findOne({ id: eventId }).lean();
        }

        if (!event) return null;

        return JSON.parse(JSON.stringify(event));
    } catch (err) {
        return null;
    }
}

export async function updateEventAction(prevState: EventState, formData: FormData): Promise<EventState> {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        const dbId = formData.get('dbId') as string;
        if (!dbId) return { error: 'Missing Event ID' };

        // Parse basic fields (excluding schedule/slots which are handled separately)
        // Reuse Schema but make ID optional since we don't update it
        // Or just pick specific fields manually

        await connectToDatabase();

        const updates = {
            name: formData.get('name'),
            club: formData.get('club'),
            type: formData.get('type'),
            category: formData.get('category'),
            maxMembers: Number(formData.get('maxMembers')),
            price: Number(formData.get('price')),
            prizePool: formData.get('prizePool'),
            description: formData.get('description'),
            isPublished: formData.get('isPublished') === 'on',
            whatsappLink: formData.get('whatsappLink') // Added
        };

        await Event.findByIdAndUpdate(dbId, updates);

        revalidatePath('/admin');
        revalidatePath('/events');
        revalidatePath('/club');

        return { success: true };

    } catch (error) {
        console.error("Update error:", error);
        return { error: 'Failed to update event' };
    }
}

// ... existing slot actions ...

export async function getSlotsAction(eventId: string) {
    try {
        await connectToDatabase();
        const Registration = (await import('@/models/Registration')).default;

        const slots = await Slot.find({ eventId }).sort({ dayNumber: 1, startTime: 1 }).lean();

        // Get live registration counts (Total People)
        const regCounts = await Registration.aggregate([
            { $match: { eventId: new (await import('mongoose')).Types.ObjectId(eventId), status: { $ne: 'CANCELLED' } } },
            { $group: { _id: "$slotId", count: { $sum: 1 } } }
        ]);

        // Get unique team counts per slot
        const teamCounts = await Registration.aggregate([
            { $match: { eventId: new (await import('mongoose')).Types.ObjectId(eventId), status: { $ne: 'CANCELLED' }, teamId: { $exists: true, $ne: null } } },
            { $group: { _id: "$slotId", teams: { $addToSet: "$teamId" } } },
            { $project: { _id: 1, count: { $size: "$teams" } } }
        ]);

        const slotsWithCounts = slots.map((slot: any) => {
            const countObj = regCounts.find((r: any) => r._id.toString() === slot._id.toString());
            const teamCountObj = teamCounts.find((r: any) => r._id.toString() === slot._id.toString());

            return {
                ...slot,
                registeredCount: countObj ? countObj.count : 0,
                teamsCount: teamCountObj ? teamCountObj.count : 0
            };
        });

        return JSON.parse(JSON.stringify(slotsWithCounts));
    } catch (error) {
        console.error("Get Slots Error:", error);
        return [];
    }
}

export async function addSlotAction(eventId: string, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        const data = Object.fromEntries(formData);
        const parsed = SlotSchema.safeParse(data);

        if (!parsed.success) {
            return { error: (parsed.error as any).errors[0].message };
        }

        await connectToDatabase();
        await Slot.create({
            eventId,
            ...parsed.data
        });

        revalidatePath(`/admin/events/${eventId}/slots`);
        return { success: true };
    } catch (error) {
        console.error('Add Slot Error:', error);
        return { error: 'Failed to add slot' };
    }
}

export async function deleteSlotAction(slotId: string, eventId: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        await Slot.findByIdAndDelete(slotId);

        revalidatePath(`/admin/events/${eventId}/slots`);
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete slot' };
    }
}

export async function updateSlotAction(eventId: string, slotId: string, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        const data = Object.fromEntries(formData);
        const parsed = SlotSchema.safeParse(data);

        if (!parsed.success) {
            return { error: (parsed.error as any).errors[0].message };
        }

        await connectToDatabase();
        await Slot.findByIdAndUpdate(slotId, {
            ...parsed.data
        });

        revalidatePath(`/admin/events/${eventId}/slots`);
        return { success: true };
    } catch (error) {
        console.error('Update Slot Error:', error);
        return { error: 'Failed to update slot' };
    }
}

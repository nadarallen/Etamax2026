'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getSession, Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import { revalidatePath } from 'next/cache';

// --- Validation Schemas ---

const EventSchema = z.object({
    id: z.string().min(2, 'ID is required (e.g., event-name-slug)'),
    name: z.string().min(2, 'Name is required'),
    type: z.enum(['solo', 'duo', 'group']),
    club: z.string().min(2, 'Club name is required'),
    category: z.string().min(2, 'Category is required'),
    maxMembers: z.coerce.number().min(1),
    price: z.coerce.number().min(0),
    prizePool: z.string().optional(),
    description: z.string(),
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
        const session = await getSession();

        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized: Only Admins can create events.' };
        }

        const data = Object.fromEntries(formData);
        const parsed = EventSchema.safeParse(data);

        if (!parsed.success) {
            return { error: (parsed.error as any).errors[0].message };
        }

        const {
            id, name, type, club, category, maxMembers, price, prizePool, description
        } = parsed.data;

        await connectToDatabase();

        const existing = await Event.findOne({ id });
        if (existing) {
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
            isPublished: true
        });

        // We do revalidate, and the client will handle the redirect
        revalidatePath('/events');
        return { success: true, eventId: newEvent._id.toString() };

    } catch (error) {
        console.error('Create Event Error:', error);
        return { error: (error as Error).message || 'Internal Server Error' };
    }
}

export async function getEventsAction() {
    try {
        await connectToDatabase();
        // Sort by creation date descending
        const events = await Event.find().sort({ createdAt: -1 }).lean();

        // Populate "live stats" (capacity/registered)
        const eventsWithStats = await Promise.all(events.map(async (ev: any) => {
            const slots = await Slot.find({ eventId: ev._id }).lean(); // Removed .toString(), using default casting
            // console.log(`DEBUG: Event ${ev.name} (${ev._id}) - Found ${slots.length} slots. IDs: ${slots.map(s => s._id)}`);

            // Try explicit string match if objectid fails (Double check)
            let finalSlots = slots;
            if (slots.length === 0) {
                const slotsString = await Slot.find({ eventId: ev._id.toString() }).lean();
                if (slotsString.length > 0) {
                    // console.log(`DEBUG: Found slots using toString() for ${ev.name}`);
                    finalSlots = slotsString;
                }
            }

            const totalCapacity = finalSlots.reduce((acc, s) => acc + s.maxCapacity, 0);
            const totalRegistered = finalSlots.reduce((acc, s) => acc + (s.registeredCount || 0), 0);
            const activeDays = [...new Set(finalSlots.map(s => s.dayNumber))]; // Unique days

            return {
                ...ev,
                stats: {
                    totalCapacity,
                    totalRegistered,
                    slotsCount: finalSlots.length
                },
                activeDays,
                slots: finalSlots // Return full slots for client-side filtering
            };
        }));
        return JSON.parse(JSON.stringify(eventsWithStats));
    } catch (error) {
        console.error('Fetch Events Error:', error);
        return [];
    }
}

export async function deleteEventAction(eventId: string): Promise<EventState> {
    try {
        const session = await getSession();
        // Strict: Only SUPER_ADMIN can delete events
        if (!session || session.role !== Role.SUPER_ADMIN) {
            return { error: 'Unauthorized: Only Super Admins can delete events.' };
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
            isPublished: formData.get('isPublished') === 'on'
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
        const slots = await Slot.find({ eventId }).sort({ dayNumber: 1, startTime: 1 }).lean();
        return JSON.parse(JSON.stringify(slots));
    } catch (error) {
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

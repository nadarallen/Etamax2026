'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getSession, Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { revalidatePath } from 'next/cache';

// Validation Schema
const EventSchema = z.object({
    id: z.string().min(2, 'ID is required (e.g., event-name-slug)'),
    name: z.string().min(2, 'Name is required'),
    type: z.enum(['solo', 'duo', 'group']),
    club: z.string().min(2, 'Club name is required'),
    maxMembers: z.coerce.number().min(1),
    price: z.coerce.number().min(0),
    prizePool: z.string(),
    description: z.string(),
    dayNumber: z.coerce.number().min(1).max(3),
    category: z.string(),
    timing: z.string(),
    venue: z.string(),
});

export type EventState = {
    error?: string;
    success?: boolean;
};

export async function createEventAction(prevState: EventState, formData: FormData): Promise<EventState> {
    try {
        const session = await getSession();

        // 1. Authorization Check: Role MUST be SUPER_ADMIN or CLUB_ADMIN
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized: Only Admins can create events.' };
        }

        const data = Object.fromEntries(formData);
        const parsed = EventSchema.safeParse(data);

        if (!parsed.success) {
            return { error: (parsed.error as any).errors[0].message };
        }

        const {
            id, name, type, club, maxMembers, price, prizePool, description,
            dayNumber, category, timing, venue
        } = parsed.data;

        await connectToDatabase();

        // Check uniqueness
        const existing = await Event.findOne({ id });
        if (existing) {
            return { error: 'An event with this ID already exists.' };
        }

        await Event.create({
            id,
            name,
            type,
            club,
            maxMembers,
            price,
            prizePool,
            description,
            schedule: {
                dayNumber,
                category,
                timing,
                venue,
            }
        });

        revalidatePath('/events');
        return { success: true };

    } catch (error) {
        console.error('Create Event Error:', error);
        return { error: 'Internal Server Error' };
    }
}

export async function getEventsAction() {
    try {
        await connectToDatabase();
        // Plain object for client components
        const events = await Event.find().sort({ 'schedule.dayNumber': 1 }).lean();

        // Convert _id and dates to string if needed, or mapping
        return JSON.parse(JSON.stringify(events));
    } catch (error) {
        console.error('Fetch Events Error:', error);
        return [];
    }
}

export async function deleteEventAction(eventId: string): Promise<EventState> {
    try {
        const session = await getSession();

        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized: Only Admins can delete events.' };
        }

        await connectToDatabase();
        await Event.findByIdAndDelete(eventId);

        revalidatePath('/events');
        revalidatePath('/admin');
        revalidatePath('/club');

        return { success: true };
    } catch (error) {
        console.error('Delete Event Error:', error);
        return { error: 'Failed to delete event' };
    }
}

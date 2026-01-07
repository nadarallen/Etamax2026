'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import { getSession, Role } from '@/lib/auth';
import mongoose from 'mongoose';

const SlotSchema = z.object({
    eventId: z.string(),
    startTime: z.string(), // Slot model expects string for now
    endTime: z.string(),
    capacity: z.coerce.number().min(1),
    venue: z.string().optional().default('TBD'), // Added venue as it's required in Slot
    dayNumber: z.coerce.number().min(1).optional().default(1), // Added dayNumber
});

export async function addSlotAction(prevState: any, formData: FormData) {
    const session = await getSession();
    // getSession returns { user: {...}, role: ... } so session.role is valid
    if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
        return { error: 'Unauthorized' };
    }

    const data = Object.fromEntries(formData);
    const parsed = SlotSchema.safeParse(data);

    if (!parsed.success) {
        return { error: 'Invalid Input' };
    }

    const { eventId, startTime, endTime, capacity, venue, dayNumber } = parsed.data;

    try {
        await connectToDatabase();

        const event = await Event.findById(eventId);
        if (!event) return { error: 'Event not found' };

        // Check ownership if Club Admin
        // Event has 'club' field. Assuming it stores the ID or name.
        if (session.role === Role.CLUB_ADMIN && event.club !== session.user.id) {
            // Note: If event.club stores name, this check might fail. Assuming ID for now based on usage.
            return { error: 'Unauthorized to edit this event' };
        }

        await Slot.create({
            eventId,
            startTime, // Ensure format matches textual requirement if needed
            endTime,
            maxCapacity: capacity,
            venue,
            dayNumber,
            registeredCount: 0
        });

    } catch (error) {
        console.error('Add Slot Error:', error);
        return { error: 'Failed to add slot' };
    }

    redirect(`/admin/events/${eventId}/slots`); // Redirect to refresh
}

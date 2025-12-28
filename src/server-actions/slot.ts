'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { getSession, Role } from '@/lib/auth';
import mongoose from 'mongoose';

const SlotSchema = z.object({
    eventId: z.string(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    capacity: z.coerce.number().min(1),
});

export async function addSlotAction(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
        return { error: 'Unauthorized' };
    }

    const data = Object.fromEntries(formData);
    const parsed = SlotSchema.safeParse(data);

    if (!parsed.success) {
        return { error: 'Invalid Input' };
    }

    const { eventId, startTime, endTime, capacity } = parsed.data;

    try {
        await connectToDatabase();

        const event = await Event.findById(eventId);
        if (!event) return { error: 'Event not found' };

        // Check ownership if Club Admin
        if (session.role === Role.CLUB_ADMIN && event.clubId.toString() !== session.userId) {
            return { error: 'Unauthorized to edit this event' };
        }

        event.slots.push({
            _id: new mongoose.Types.ObjectId(),
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            capacity,
            bookedCount: 0
        } as any); // Cast to any or ISlot to avoid strict type mismatch with Mongoose Document Array

        await event.save();

    } catch (error) {
        console.error('Add Slot Error:', error);
        return { error: 'Failed to add slot' };
    }

    redirect(`/admin/events/${eventId}/slots`); // Redirect to refresh
}

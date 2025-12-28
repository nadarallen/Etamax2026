'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import Event, { EventType } from '@/models/Event';
import { getSession, Role } from '@/lib/auth';
import mongoose from 'mongoose';

const EventSchema = z.object({
    title: z.string().min(3),
    description: z.string(),
    eventType: z.nativeEnum(EventType),
    price: z.coerce.number().min(0),
    minTeamSize: z.coerce.number().min(1),
    maxTeamSize: z.coerce.number().min(1),
    // Add other fields as needed
});

export async function createEventAction(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
        return { error: 'Unauthorized' };
    }

    const data = Object.fromEntries(formData);
    const parsed = EventSchema.safeParse(data);

    if (!parsed.success) {
        return { error: 'Invalid Input: ' + parsed.error.issues.map(i => i.message).join(', ') };
    }

    try {
        await connectToDatabase();

        const newEvent = await Event.create({
            ...parsed.data,
            clubId: session.userId, // Assigned to creator
            isPublished: false, // Draft by default
            slots: [] // Empty slots initially
        });

    } catch (error) {
        console.error('Create Event Error:', error);
        return { error: 'Failed to create event' };
    }

    redirect('/admin'); // Or /club
}

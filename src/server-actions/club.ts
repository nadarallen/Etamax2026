'use server';

import { z } from 'zod'; // Prompt 2, 6
import { redirect } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { getSession, Role } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const CreateEventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    eventType: z.enum(['solo', 'duo', 'group']),
    price: z.coerce.number().min(0, "Price must be positive"),
    minTeamSize: z.coerce.number().min(1),
    maxTeamSize: z.coerce.number().min(1),
});

type State = {
    error?: string;
    fieldErrors?: Record<string, string[]>;
    success?: boolean;
    eventId?: string;
};

export async function createEventAction(prevState: State, formData: FormData): Promise<State> {
    const session = await getSession();
    if (!session || (session.role !== Role.CLUB_ADMIN && session.role !== Role.SUPER_ADMIN)) {
        return { error: "Unauthorized" };
    }

    // 1. Validate Input
    const validatedFields = CreateEventSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
        eventType: formData.get('eventType'),
        price: formData.get('price'),
        minTeamSize: formData.get('minTeamSize'),
        maxTeamSize: formData.get('maxTeamSize'),
    });

    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors
        };
    }

    const { title, description, eventType, price, minTeamSize, maxTeamSize } = validatedFields.data;

    // 2. Custom Validator
    if (minTeamSize > maxTeamSize) {
        return { error: "Min Team Size cannot be greater than Max Team Size" };
    }

    try {
        await connectToDatabase();

        // 3. Create Event
        const newEvent = await Event.create({
            clubId: session.user.id,
            title,
            description,
            eventType,
            price,
            minTeamSize: eventType === 'solo' ? 1 : minTeamSize,
            maxTeamSize: eventType === 'solo' ? 1 : maxTeamSize,
            isPublished: false, // Default to draft
        });

        revalidatePath('/club');
        return { success: true, eventId: newEvent._id.toString() };

    } catch (error) {
        console.error("Create Event Error:", error);
        return { error: "Failed to create event" };
    }
}

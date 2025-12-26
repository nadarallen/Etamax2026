'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import { getSession, Role } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const CreateClubSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

type State = {
    error?: string;
    success?: boolean;
};

export async function createClubUserAction(prevState: State, formData: FormData): Promise<State> {
    const session = await getSession();
    if (session?.role !== Role.SUPER_ADMIN) {
        return { error: "Unauthorized" };
    }

    const parsed = CreateClubSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Invalid Data" };

    const { name, email, password } = parsed.data;

    try {
        await connectToDatabase();
        const existing = await User.findOne({ email });
        if (existing) return { error: "Email already exists" };

        const passwordHash = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            passwordHash,
            role: Role.CLUB_ADMIN
        });

        revalidatePath('/admin/users');
        return { success: true };

    } catch (error) {
        console.error("Create Club Error:", error);
        return { error: "Failed to create club account" };
    }
}

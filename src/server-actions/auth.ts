'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { setSessionCookie, clearSession, Role, signToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Validation Schemas
const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rollNumber: z.string().optional(), // Optional in Zod, enforced logically
    branch: z.string().optional(),
    semester: z.string().optional(),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});

export type AuthState = {
    error?: string;
    success?: boolean;
};

export async function registerAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const data = Object.fromEntries(formData);
    const parsed = RegisterSchema.safeParse(data);

    if (!parsed.success) {
        return { error: (parsed.error as any).errors[0].message };
    }

    const { name, email, password, rollNumber, branch, semester } = parsed.data;

    try {
        await connectToDatabase();

        // Debug Log
        console.log("Register Action Payload:", { name, email, role: 'PENDING', rollNumber, branch, semester });

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return { error: 'User already exists with this email.' };
        }

        // Determine Role
        let role = Role.STUDENT;
        if (email === 'superadmin@etamax.com') role = Role.SUPER_ADMIN;
        if (email === 'clubadmin@etamax.com') role = Role.CLUB_ADMIN;

        // Enforce Roll Number and Branch for Students
        if (role === Role.STUDENT) {
            if (!rollNumber || rollNumber.trim() === '') {
                return { error: 'Roll Number is required for students.' };
            }
            if (!branch || branch.trim() === '') {
                return { error: 'Branch is required for students.' };
            }
            if (!semester || semester.trim() === '') {
                return { error: 'Semester is required for students.' };
            }
        }

        // Hash Password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create User
        const newUser = await User.create({
            name,
            email,
            passwordHash,
            role,
            rollNumber: role === Role.STUDENT ? rollNumber : undefined,
            branch: role === Role.STUDENT ? branch : undefined,
            semester: role === Role.STUDENT ? semester : undefined,
        });

        // Create Session
        const sessionPayload = {
            userId: newUser._id.toString(),
            email: newUser.email,
            role: newUser.role,
            name: newUser.name,
        };

        const token = await signToken(sessionPayload);
        await setSessionCookie(token);

    } catch (error) {
        console.error('Registration Error:', error);
        return { error: 'Internal Server Error' };
    }

    redirect('/events');
}

export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const data = Object.fromEntries(formData);
    const parsed = LoginSchema.safeParse(data);

    if (!parsed.success) {
        return { error: 'Invalid input' };
    }

    const { email, password } = parsed.data;
    let redirectPath = '/events';

    try {
        await connectToDatabase();

        const user = await User.findOne({ email }).select('+passwordHash');

        if (!user || !user.passwordHash) {
            return { error: 'Invalid credentials' };
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            return { error: 'Invalid credentials' };
        }

        // Create Session
        const sessionPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role as unknown as Role, // Force cast if model type differs, but ideally align types
            name: user.name,
        };

        const token = await signToken(sessionPayload);
        await setSessionCookie(token);

        // Determine Redirect
        if (sessionPayload.role === Role.CLUB_ADMIN) redirectPath = '/club';
        if (sessionPayload.role === Role.SUPER_ADMIN) redirectPath = '/admin';

    } catch (error) {
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error('Login Error:', error);
        return { error: 'Something went wrong' };
    }

    redirect(redirectPath);
}

export async function logoutAction() {
    await clearSession();
    redirect('/login');
}

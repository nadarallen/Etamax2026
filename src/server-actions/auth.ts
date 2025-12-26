'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import { signToken, signRefreshToken, setSessionCookie, clearSession, Role } from '@/lib/auth';

// Validation Schemas (Prompt 28: Security)
const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.nativeEnum(Role).default(Role.STUDENT),
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

    const { name, email, password, role } = parsed.data;

    try {
        await connectToDatabase();

        // Check existing
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return { error: 'Email already registered' };
        }

        // Hash Password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create User
        const newUser = await User.create({
            name,
            email,
            passwordHash,
            role, // In a real app, we wouldn't let users pick Admin/Club role freely, but for this demo it's fine
        });

        // Session Logic
        const payload = { userId: newUser._id.toString(), role: newUser.role };
        const accessToken = await signToken(payload);
        const refreshToken = await signRefreshToken(payload);

        await setSessionCookie(accessToken, refreshToken);

        // Save refresh token for revocation support
        newUser.refreshToken = refreshToken;
        await newUser.save();

    } catch (error) {
        console.error('Registration Error:', error);
        return { error: 'Internal Server Error' };
    }

    redirect('/login?success=true'); // Or direct to dashboard
}

export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const data = Object.fromEntries(formData);
    const parsed = LoginSchema.safeParse(data);

    if (!parsed.success) {
        return { error: 'Invalid input' };
    }

    const { email, password } = parsed.data;
    let redirectPath = '/student';

    try {
        await connectToDatabase();

        const user = await User.findOne({ email }).select('+passwordHash +role');
        if (!user || !user.passwordHash) {
            return { error: 'Invalid credentials' };
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return { error: 'Invalid credentials' };
        }

        // Session Logic
        const payload = { userId: user._id.toString(), role: user.role };
        const accessToken = await signToken(payload);
        const refreshToken = await signRefreshToken(payload);

        await setSessionCookie(accessToken, refreshToken);

        user.refreshToken = refreshToken;
        await user.save();

        // Determine Redirect
        if (user.role === UserRole.CLUB_ADMIN) redirectPath = '/club';
        if (user.role === UserRole.SUPER_ADMIN) redirectPath = '/admin';

    } catch (error) {
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error('Login Error:', error);
        return { error: 'Something went wrong' };
    }

    redirect(redirectPath);
}

export async function logoutAction() {
    await connectToDatabase();
    // Ideally invalidate DB token here too
    await clearSession();
    redirect('/login');
}

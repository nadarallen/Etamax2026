'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { setSessionCookie, clearSession, Role, signToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';

// Validation Schemas
const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required').transform(val => val.replace(/\D/g, '')).refine(val => val.length === 10, 'Phone number must be exactly 10 digits'),
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

    const { name, email, phone, rollNumber, branch, semester } = parsed.data;

    try {
        await connectToDatabase();

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
            if (!rollNumber || rollNumber.trim() === '') return { error: 'Roll Number is required.' };
            if (!/^\d{7}$/.test(rollNumber)) return { error: 'Roll Number must be exactly 7 digits.' };
            if (!branch || branch.trim() === '') return { error: 'Branch is required.' };
            if (!semester || semester.trim() === '') return { error: 'Semester is required.' };

            // Check if Roll Number already exists
            const existingRoll = await User.findOne({ rollNumber });
            if (existingRoll) {
                return { error: 'This Roll Number is already registered. Please login or use a different one.' };
            }
        }

        // Generate Random Password
        const { customAlphabet } = await import('nanoid');
        const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
        const generatedPassword = nanoid();

        // Hash Password
        const passwordHash = await bcrypt.hash(generatedPassword, 10);

        // Create User
        const newUser = await User.create({
            name,
            email,
            phone,
            passwordHash,
            generatedPassword,
            role,
            rollNumber: role === Role.STUDENT ? rollNumber : undefined,
            branch: role === Role.STUDENT ? branch : undefined,
            semester: role === Role.STUDENT ? semester : undefined,
        });

        // Email Credentials
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            console.log("Attempting to send email from:", process.env.EMAIL_USER);

            const emailHtml = `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #4CAF50; text-align: center;">Greetings from Etamax 2026!</h2>
                    <p style="font-size: 16px;">Welcome to the Etamax family. Your account has been successfully created.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 5px 0;"><strong>Password:</strong> ${generatedPassword}</p>
                    </div>
                    <p style="font-size: 14px; color: #666;">Please use these credentials to login.</p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(generatedPassword)}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
                    </div>
                </div>
            `;

            await sendEmail({
                to: email,
                subject: 'Greetings from Etamax 2026 - Your Account Credentials',
                html: emailHtml,
            });
        } else {
            console.warn("WARNING: EMAIL_USER or EMAIL_PASS is missing in env variables.");
        }

        // Create Session
        const sessionPayload = {
            userId: newUser._id.toString(),
            email: newUser.email,
            role: newUser.role as unknown as Role,
            name: newUser.name,
        };

        // DO NOT Auto-Login. 
        // User must check email for password.
        // await setSessionCookie(token); <-- REMOVED

    } catch (error) {
        console.error('Registration Error:', error);
        return { error: 'Internal Server Error' };
    }

    redirect('/login?registered=true');
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

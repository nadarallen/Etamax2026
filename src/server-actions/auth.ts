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

    const { name, email, rollNumber, branch, semester } = parsed.data;

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
            if (!branch || branch.trim() === '') return { error: 'Branch is required.' };
            if (!semester || semester.trim() === '') return { error: 'Semester is required.' };
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
            try {
                const transporter = (await import('nodemailer')).createTransport({
                    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
                    port: Number(process.env.EMAIL_PORT) || 465,
                    secure: true,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS?.replace(/\s+/g, '') // Robustly strip spaces
                    },
                });

                const info = await transporter.sendMail({
                    from: '"Etamax 2026" <' + process.env.EMAIL_USER + '>',
                    to: email,
                    subject: 'Welcome to Etamax 2026 - Your Account Credentials',
                    html: `
                        <div style="font-family: sans-serif; line-height: 1.5;">
                            <h2>Welcome to Etamax 2026</h2>
                            <p>Your account has been created.</p>
                            <p><strong>Email:</strong> ${email}<br>
                            <strong>Password:</strong> ${generatedPassword}</p>
                            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Click here to Login</a></p>
                        </div>
                    `
                });
                console.log("Email sent successfully! Message ID:", info.messageId);
            } catch (emailError) {
                console.error("CRITICAL: Failed to send credential email:", emailError);
                // Optionally return specific error or just proceed (User created but no email)
            }
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

        // Check if ENV is loaded (Debug)
        console.log("DEBUG: EMAIL_USER:", process.env.EMAIL_USER);
        console.log("DEBUG: EMAIL_PASS Length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

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

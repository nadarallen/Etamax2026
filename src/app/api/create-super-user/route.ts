import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await connectToDatabase();

        const email = 'super@etamax.com';
        const password = 'password123';

        // Check if exists
        const existing = await User.findOne({ email });
        if (existing) {
            return NextResponse.json({ message: 'User already exists', email });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const superAdmin = await User.create({
            name: 'Root Super Admin',
            email,
            passwordHash,
            role: UserRole.SUPER_ADMIN,
        });

        return NextResponse.json({
            message: 'Super Admin Created Successfully',
            credentials: { email, password }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to create user', details: error }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Admin credentials not set in env' }, { status: 500 });
        }

        await connectToDatabase();

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Upsert Admin User
        const result = await User.findOneAndUpdate(
            { email: ADMIN_EMAIL },
            {
                $set: {
                    name: 'Super Admin',
                    email: ADMIN_EMAIL,
                    role: UserRole.SUPER_ADMIN,
                    passwordHash: passwordHash,
                    generatedPassword: ADMIN_PASSWORD
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Super Admin Seeded: ${result.email}`);

        return NextResponse.json({
            success: true,
            message: `Admin ${result.email} seeded successfully`
        });

    } catch (error) {
        console.error('Seeding Error:', error);
        return NextResponse.json({ error: 'Seeding failed', details: String(error) }, { status: 500 });
    }
}

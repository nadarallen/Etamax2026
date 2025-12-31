import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        // Fetch user details from database
        await connectToDatabase();
        const user = await User.findById(session.userId).select('-passwordHash -refreshToken');

        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}

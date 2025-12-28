import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    try {
        await connectToDatabase();
        // Fetch fresh user data (in case role changed, etc)
        const user = await User.findById(session.userId).select('name email role college');

        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college
            }
        });
    } catch (error) {
        console.error('Auth API Error:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}

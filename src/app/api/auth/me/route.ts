import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
// import connectToDatabase from '@/lib/db';
// import User from '@/models/User';

export async function GET() {
    const session: any = await getSession();

    if (!session || !session.user) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    try {
        // await connectToDatabase();
        // Fetch fresh user data (in case role changed, etc)
        // const user = await User.findById(session.userId).select('name email role college');

        const user = session.user;
        const metadata = user.user_metadata || {};

        return NextResponse.json({
            user: {
                id: user.id,
                name: metadata.name,
                email: user.email,
                role: metadata.role, // or session.role
                college: metadata.college || null
            }
        });
    } catch (error) {
        console.error('Auth API Error:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}

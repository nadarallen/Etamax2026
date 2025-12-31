import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import Event from '@/models/Event';
import bcrypt from 'bcryptjs';

export async function GET() {
    await connectToDatabase();

    // 1. Clean up
    await User.deleteMany({});
    await Event.deleteMany({});

    // 2. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const superAdmin = await User.create({
        name: 'Super Admin',
        email: 'admin@etamax.com',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
    });

    const clubAdmin = await User.create({
        name: 'Tech Club President',
        email: 'tech@etamax.com',
        passwordHash,
        role: UserRole.CLUB_ADMIN,
    });

    const student = await User.create({
        name: 'Alice Student',
        email: 'alice@student.com',
        passwordHash,
        role: UserRole.STUDENT,
        rollNumber: '12345',
        branch: 'COMPS',
        semester: '5'
    });

    // 3. Create Events
    const events = [
        {
            id: 'hackathon-2025',
            name: 'Hackathon 2025',
            description: '24-hour coding marathon. Build the future.',
            type: 'group',
            category: 'Tech',
            maxMembers: 4,
            price: 500, // Per team
            club: 'Tech Club',
            isPublished: true,
        },
        {
            id: 'solo-singing',
            name: 'Solo Singing',
            description: 'Showcase your vocal talent.',
            type: 'solo',
            category: 'Cultural',
            maxMembers: 1,
            price: 200,
            club: 'Music Club',
            isPublished: true,
        }
    ];

    await Event.create(events);

    return NextResponse.json({ message: 'Seeding Complete', users: { superAdmin, clubAdmin, student } });
}

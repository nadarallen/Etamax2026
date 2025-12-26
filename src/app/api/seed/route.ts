import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import Event, { EventType } from '@/models/Event';
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
    });

    // 3. Create Events
    const events = [
        {
            title: 'Hackathon 2025',
            description: '24-hour coding marathon. Build the future.',
            eventType: EventType.TEAM,
            minTeamSize: 2,
            maxTeamSize: 4,
            price: 500, // Per person
            clubId: clubAdmin._id,
            isPublished: true,
            slots: [
                {
                    startTime: new Date(new Date().setHours(10, 0, 0, 0)),
                    endTime: new Date(new Date().setHours(18, 0, 0, 0)),
                    capacity: 50,
                }
            ]
        },
        {
            title: 'Solo Singing',
            description: 'Showcase your vocal talent.',
            eventType: EventType.SOLO,
            minTeamSize: 1,
            maxTeamSize: 1,
            price: 200,
            clubId: clubAdmin._id,
            isPublished: true,
            slots: [
                {
                    startTime: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
                    endTime: new Date(new Date().setDate(new Date().getDate() + 1)),
                    capacity: 20,
                }
            ]
        }
    ];

    await Event.create(events);

    return NextResponse.json({ message: 'Seeding Complete', users: { superAdmin, clubAdmin, student } });
}

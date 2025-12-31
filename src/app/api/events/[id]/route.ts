import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return new NextResponse('Invalid ID', { status: 400 });
    }

    try {
        await connectToDatabase();
        const event = await Event.findById(id).lean();

        if (!event) {
            return new NextResponse('Event not found', { status: 404 });
        }

        // Optionally exclude sensitive data if any
        return NextResponse.json(event);
    } catch (error) {
        console.error('Fetch Event Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

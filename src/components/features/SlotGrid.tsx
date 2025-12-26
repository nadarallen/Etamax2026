import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { SlotSelectionClient } from './SlotSelectionClient';

// Force strict dynamic fetching for this component ensures fresh slot data
// even if the parent page was static.
export const dynamic = 'force-dynamic';

export default async function SlotGrid({ eventId, eventType }: { eventId: string, eventType: string }) {
    await connectToDatabase();

    // Fetch fresh slots (Source of Truth) using ID
    const event = await Event.findById(eventId).select('slots');
    if (!event) return <div className="text-red-500">Event not found</div>;

    // Transform for Client
    const slots = event.slots.map((s: any) => ({
        _id: s._id.toString(),
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.capacity,
        bookedCount: s.bookedCount,
    }));

    return <SlotSelectionClient slots={slots} eventId={eventId} eventType={eventType} />;
}

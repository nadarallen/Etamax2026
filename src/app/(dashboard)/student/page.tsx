import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { EventCard } from '@/components/features/EventCard';

export const revalidate = 60; // ISR for 60 seconds (Prompt 9)

async function getEvents() {
    await connectToDatabase();
    // Prompt 29: Projection to save bandwidth
    const events = await Event.find({ isPublished: true }).select('-__v');
    return JSON.parse(JSON.stringify(events)); // Serializable for Server Components
}

export default async function StudentDashboard() {
    const events = await getEvents();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Explore Events</h2>
                <p className="text-gray-400 mt-2">Discover and register for the coolest events on campus.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {events.map((event: any) => (
                    <EventCard key={event._id} event={event} />
                ))}
            </div>

            {events.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center text-gray-500">
                    No events found. Admin needs to seed data.
                </div>
            )}
        </div>
    );
}

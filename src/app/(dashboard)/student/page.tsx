import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { EventCard } from '@/components/features/EventCard';
import { Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60; // ISR for 60 seconds

async function getEvents() {
    await connectToDatabase();
    // Projection to save bandwidth
    const events = await Event.find({ isPublished: true }).select('-__v');
    return JSON.parse(JSON.stringify(events)); // Serializable for Server Components
}

export default async function StudentDashboard() {
    const events = await getEvents();

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Intro Section */}
                <div className="md:col-span-3">
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Explore Events</h2>
                    <p className="text-gray-400">Discover and register for the coolest events on campus.</p>
                </div>

                {/* My Teams Shortcut */}
                <div className="md:col-span-1">
                    <Link href="/student/teams" className="block p-4 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl border border-white/10 hover:border-white/20 transition group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-white">My Squads</h3>
                            <Shield className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-gray-400 text-xs mb-3">View joined teams & status.</p>
                        <div className="flex items-center text-purple-300 text-xs font-bold uppercase tracking-wider">
                            Manage <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Event Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {events.map((event: any) => (
                    <EventCard key={event._id} event={event} />
                ))}
            </div>

            {events.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center text-gray-500">
                    No active events found. Check back later!
                </div>
            )}
        </div>
    );
}

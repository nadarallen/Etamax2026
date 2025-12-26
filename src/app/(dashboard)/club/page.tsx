import Link from 'next/link';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { getSession } from '@/lib/auth';
import { Plus, Users, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function ClubDashboard() {
    const session = await getSession();
    await connectToDatabase();

    // Fetch events owned by this club
    const events = await Event.find({ clubId: session?.userId }).lean();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">My Events</h2>
                    <p className="text-gray-400 mt-1">Manage slots and view registrations</p>
                </div>
                <Link href="/club/events/new" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center">
                    <Plus className="w-5 h-5 mr-2" /> Create Event
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map((event: any) => {
                    const totalCapacity = event.slots.reduce((acc: number, s: any) => acc + s.capacity, 0);
                    const totalBooked = event.slots.reduce((acc: number, s: any) => acc + s.bookedCount, 0);
                    const fillPercentage = Math.round((totalBooked / totalCapacity) * 100) || 0;

                    return (
                        <div key={event._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{event.title}</h3>
                                        <span className={event.isPublished ? "text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded" : "text-yellow-400 bg-yellow-900/20 px-2 py-0.5 rounded"}>
                                            {event.isPublished ? 'PUBLISHED' : 'DRAFT'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">{formatCurrency(event.price)}</p>
                                        <p className="text-xs text-gray-500">{event.eventType}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Occupancy</span>
                                        <span className="text-white font-medium">{fillPercentage}% ({totalBooked}/{totalCapacity})</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${fillPercentage}%` }}></div>
                                    </div>
                                </div>

                                <div className="flex gap-3 text-sm text-gray-400 mb-6">
                                    <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {event.slots.length} Slots</span>
                                </div>

                                <Link
                                    href={`/club/events/${event._id}`}
                                    className="block w-full bg-gray-800 hover:bg-gray-700 text-white text-center py-2.5 rounded-lg border border-gray-700 font-medium transition"
                                >
                                    Manage Slots
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

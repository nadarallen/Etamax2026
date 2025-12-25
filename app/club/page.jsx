'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import eventsData from '@/data/events.json';
import { Settings, LogOut, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import EventForm from '@/components/EventForm';

export default function ClubAdminPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const key = searchParams.get('key');
    const clubName = searchParams.get('club');

    const [authorized, setAuthorized] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // Guard Logic
        if (key !== 'ETAMAX_CLUB_2026' || !clubName) {
            router.push('/events');
        } else {
            setAuthorized(true);
            // Filter events for this club
            // Note: In a real app we would fetch from API. Here we filter mock data.
            // Since events.json might not have 'club' field populated for all yet, we handle gracefully.
            const clubEvents = eventsData.filter(e =>
                (e.club && e.club.toLowerCase() === clubName.toLowerCase())
            );
            setEvents(clubEvents);
        }
    }, [key, clubName, router]);

    if (!authorized) return null;

    const handleCreateEvent = (formData) => {
        // Mock save for club
        const newEvent = {
            id: formData.name.toLowerCase().replace(/\s+/g, '-'),
            ...formData,
            club: clubName, // Enforce club name
            schedule: {
                dayNumber: formData.dayNumber,
                category: formData.category,
                timing: 'TBD',
                venue: 'TBD'
            }
        };
        setEvents([newEvent, ...events]);
        setIsCreating(false);
    };

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-widest flex items-center gap-3">
                        <Settings className="text-galaxy-purple" />
                        CLUB DASHBOARD
                    </h1>
                    <p className="text-gray-400 mt-2">Managing: <span className="text-white font-bold">{clubName}</span></p>
                </div>

                <div className="flex gap-4">
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-6 py-2 rounded-full bg-galaxy-purple text-white hover:bg-galaxy-purple/90 transition-all shadow-lg shadow-galaxy-purple/20"
                        >
                            <Plus size={18} />
                            Create Event
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsCreating(false)}
                            className="flex items-center gap-2 px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition-all"
                        >
                            <ArrowLeft size={18} />
                            Cancel
                        </button>
                    )}

                    <Link href="/events">
                        <button className="flex items-center gap-2 px-6 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                            <LogOut size={16} />
                            Exit
                        </button>
                    </Link>
                </div>
            </div>

            {isCreating ? (
                <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Create New Event for {clubName}</h2>
                    {/* Pass initialData with club name to lock it */}
                    <EventForm
                        onSubmit={handleCreateEvent}
                        onCancel={() => setIsCreating(false)}
                        initialData={{ club: clubName }}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.length > 0 ? (
                        events.map((event) => (
                            <div key={event.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-galaxy-purple/30 transition-all group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${event.schedule.category === 'Technical' ? 'bg-blue-500/20 text-blue-400' :
                                            event.schedule.category === 'Cultural' ? 'bg-pink-500/20 text-pink-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {event.schedule.category}
                                    </span>
                                    <span className="text-lg font-bold text-white/50">₹{event.price}</span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-galaxy-purple transition-colors">{event.name}</h3>

                                <div className="space-y-2 mb-6 pt-4 border-t border-white/5 mt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Day:</span>
                                        <span className="text-gray-300">Day {event.schedule.dayNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Type:</span>
                                        <span className="text-gray-300 capitalize">{event.type}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors border border-white/5">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-500">
                            <p className="text-xl">No events found for {clubName}.</p>
                            <button onClick={() => setIsCreating(true)} className="text-galaxy-purple hover:underline mt-2">
                                Create your first event
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

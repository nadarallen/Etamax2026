'use client';
import { useState, useEffect } from 'react';
import { logoutAction } from '@/server-actions/auth';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { getEventsAction } from '@/server-actions/events';
import EventCard from '@/components/EventCard';
import TabsDay from '@/components/TabsDay';
import TabsCategory from '@/components/TabsCategory';

export default function EventsPage() {
    const [activeDay, setActiveDay] = useState(1);
    const [activeCategory, setActiveCategory] = useState('Technical');
    const [activeFilter, setActiveFilter] = useState(null);
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);

    // Fetch Events on Mount
    useEffect(() => {
        async function loadEvents() {
            const data = await getEventsAction();
            setEvents(data);
        }
        loadEvents();
    }, []);

    // Filter Logic
    useEffect(() => {
        let filtered = events.filter(event =>
            event.isPublished !== false && // Show if true or undefined (legacy events)
            ((event.activeDays || []).includes(activeDay) || (event.activeDays || []).length === 0) &&
            event.category === activeCategory
        );

        if (activeFilter) {
            filtered = filtered.filter(event => event.type === activeFilter);
        }

        setFilteredEvents(filtered);
    }, [activeDay, activeCategory, activeFilter, events]);

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col space-y-8">
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tighter text-center md:text-left">
                        EVENTS
                    </h1>
                    <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
                        <Link
                            href="/profile"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-galaxy-purple/10 hover:bg-galaxy-purple/20 text-galaxy-purple hover:text-white rounded-xl transition-all duration-300 border border-galaxy-purple/20 flex-1 md:flex-none"
                        >
                            <User size={18} />
                            <span className="font-medium text-sm whitespace-nowrap">My Profile</span>
                        </Link>
                        <button
                            onClick={async () => await logoutAction()}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 border border-red-500/20 flex-1 md:flex-none"
                        >
                            <LogOut size={18} />
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Event Type Filter Pills */}
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'All', value: null },
                        { label: 'Solo', value: 'solo' },
                        { label: 'Duo', value: 'duo' },
                        { label: 'Group', value: 'group' }
                    ].map((type) => (
                        <button
                            key={type.label}
                            onClick={() => setActiveFilter(type.value)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ${activeFilter === type.value
                                ? 'bg-galaxy-purple border-galaxy-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-8">
                    <TabsDay activeDay={activeDay} onChange={setActiveDay} />
                    <TabsCategory activeCategory={activeCategory} onChange={setActiveCategory} />
                </div>
            </div>

            {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} activeDay={activeDay} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500 text-xl">
                    No events found for this category.
                </div>
            )}


        </div>
    );
}

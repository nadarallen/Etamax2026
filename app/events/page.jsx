'use client';
import { useState, useEffect } from 'react';
import eventsData from '@/data/events.json';
import EventCard from '@/components/EventCard';
import TabsDay from '@/components/TabsDay';
import TabsCategory from '@/components/TabsCategory';


export default function EventsPage() {
    const [activeDay, setActiveDay] = useState(1);
    const [activeCategory, setActiveCategory] = useState('Technical');
    const [activeFilter, setActiveFilter] = useState(null); // null, 'solo', 'duo', 'group'
    const [filteredEvents, setFilteredEvents] = useState([]);

    useEffect(() => {
        let filtered = eventsData.filter(event =>
            event.schedule.dayNumber === activeDay &&
            event.schedule.category === activeCategory
        );

        if (activeFilter) {
            filtered = filtered.filter(event => event.type === activeFilter);
        }

        setFilteredEvents(filtered);
    }, [activeDay, activeCategory, activeFilter]);

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col space-y-8">
                <div className="flex justify-between items-end">
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tighter">
                        EVENTS
                    </h1>
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
                        <EventCard key={event.id} event={event} />
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

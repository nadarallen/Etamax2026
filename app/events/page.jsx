'use client';
import { useState, useEffect } from 'react';
import eventsData from '@/data/events.json';
import EventCard from '@/components/EventCard';
import TabsDay from '@/components/TabsDay';
import TabsCategory from '@/components/TabsCategory';
import FilterModal from '@/components/FilterModal';
import { Filter } from 'lucide-react';

export default function EventsPage() {
    const [activeDay, setActiveDay] = useState(1);
    const [activeCategory, setActiveCategory] = useState('Technical');
    const [activeFilter, setActiveFilter] = useState(null); // null, 'solo', 'duo', 'group'
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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
        <div className="min-h-screen pt-20 pb-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-display font-bold text-white tracking-widest">
                    EVENTS
                </h1>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all"
                >
                    <Filter size={20} />
                    <span>Filter</span>
                </button>
            </div>

            <TabsDay activeDay={activeDay} onChange={setActiveDay} />
            <TabsCategory activeCategory={activeCategory} onChange={setActiveCategory} />

            {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500 text-xl">
                    No events found for this category.
                </div>
            )}

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />
        </div>
    );
}

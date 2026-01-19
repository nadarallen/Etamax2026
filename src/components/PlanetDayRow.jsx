'use client';
import { useState } from 'react';
import PlanetIcon from './PlanetIcon';
import EventAccordion from './EventAccordion';

export default function PlanetDayRow({ day, events, isExpanded, onToggle, activeDay, expandedEventId, setExpandedEventId, hasRegistration }) {

    const [activeCategory, setActiveCategory] = useState('Technical');
    const [activeFilter, setActiveFilter] = useState(null);

    // Filter events locally within the Day
    const filteredEvents = events.filter(event => {
        const matchesCategory = event.category === activeCategory;
        const matchesType = !activeFilter || event.type === activeFilter;
        return matchesCategory && matchesType;
    });

    return (
        <div className="relative pl-8 md:pl-16 py-8 md:py-12">
            {/* Timeline Line (Vertical) */}
            {day !== 3 && (
                <div className="absolute left-[2.25rem] md:left-[4.25rem] top-20 bottom-[-20px] w-1 bg-gradient-to-b from-galaxy-purple/50 to-transparent z-0"></div>
            )}

            <div className="relative z-10">
                {/* Planet + Title Clickable Row */}
                <button
                    onClick={onToggle}
                    className="group flex items-center gap-6 md:gap-10 w-full text-left transition-transform active:scale-[0.98]"
                >
                    {/* Planet Container - Dynamic Glow */}
                    <div className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full transition-all duration-500 
                        ${hasRegistration ? 'grayscale-0 drop-shadow-[0_0_35px_rgba(234,179,8,0.8)] scale-110' : 'grayscale hover:grayscale-0'}
                        ${isExpanded && !hasRegistration ? 'grayscale-0 scale-105' : ''}
                        `}>
                        <div className={`w-full h-full rounded-full ${isExpanded ? 'animate-spin-slow' : ''}`}>
                            <PlanetIcon day={day} size="large" />
                        </div>

                        {/* Success Badge if Registered */}
                        {hasRegistration && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-yellow-300 animate-bounce">
                                COMPLETED
                            </div>
                        )}
                    </div>

                    {/* Title Text */}
                    <div className="flex-1">
                        <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter transition-colors duration-300 ${isExpanded ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                            Day 0{day}
                        </h2>
                        <div className={`text-sm md:text-base font-medium tracking-widest uppercase mt-1 transition-colors ${isExpanded ? 'text-galaxy-accent' : 'text-gray-600'}`}>
                            {events.length} Events Scheduled
                        </div>
                    </div>
                </button>

                {/* Expanded Content Box (The "Rectangle Box") */}
                <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] mt-8' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <div className="bg-black/40 border border-white/10 rounded-3xl p-4 md:p-10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group-hover:border-white/20 transition-colors duration-500">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-galaxy-purple/20 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] -ml-24 -mb-24 pointer-events-none"></div>

                            {/* LOCAL FILTERS */}
                            <div className="flex flex-col gap-6 mb-8 relative z-10">
                                {/* Category Tabs - Premium Look */}
                                <div className="flex flex-col sm:flex-row p-1.5 bg-black/40 border border-white/5 rounded-2xl w-full md:w-fit self-center md:self-start gap-2 sm:gap-0">
                                    {['Technical', 'Cultural', 'Seminar'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`relative flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 overflow-hidden ${activeCategory === cat ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {/* Active Indicator Background */}
                                            {activeCategory === cat && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-galaxy-purple to-purple-600 rounded-xl z-0"></div>
                                            )}
                                            <span className="relative z-10">{cat}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Type Pills - Modern Tags */}
                                <div className="flex flex-wrap gap-3 items-center">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mr-2">Filter By:</span>
                                    {[
                                        { label: 'All', value: null },
                                        { label: 'Solo', value: 'solo' },
                                        { label: 'Duo', value: 'duo' },
                                        { label: 'Group', value: 'group' }
                                    ].map((type) => (
                                        <button
                                            key={type.label}
                                            onClick={() => setActiveFilter(type.value)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${activeFilter === type.value
                                                ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {filteredEvents.length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {filteredEvents.map(event => (
                                        <EventAccordion
                                            key={event.id}
                                            event={event}
                                            activeDay={day}
                                            isOpen={expandedEventId === event.id}
                                            onToggle={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No {activeCategory} ({activeFilter || 'All'}) events found for Day {day}.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

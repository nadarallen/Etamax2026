'use client';
import { useState, useEffect } from 'react';
import { logoutAction } from '@/server-actions/auth';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { getEventsAction } from '@/server-actions/events';
import EventAccordion from '@/components/EventAccordion';
import PlanetDayRow from '@/components/PlanetDayRow';

import { getUserRegistrationsAction } from '@/server-actions/user';


export default function EventsPage() {
    const [expandedDay, setExpandedDay] = useState(null);
    const [events, setEvents] = useState([]);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [userRegistrations, setUserRegistrations] = useState([]);
    // const [criteriaMet, setCriteriaMet] = useState(false);
    const [criteria, setCriteria] = useState({ technical: 0, cultural: 0, seminar: 0, met: false });
    const [masterReceiptId, setMasterReceiptId] = useState(null);

    // Fetch Events and User Registrations on Mount
    useEffect(() => {
        async function loadData() {
            try {
                // 1. Fetch All Events
                const eventsData = await getEventsAction();
                setEvents(eventsData);

                // 2. Fetch User Registrations
                const regsData = await getUserRegistrationsAction();
                if (regsData.success) {
                    setUserRegistrations(regsData.registrations);

                    // 3. Calculate Criteria (Same logic as Event Detail)
                    // 3. Calculate Criteria (Case Insensitive)
                    let techCount = 0, cultCount = 0, semCount = 0;
                    regsData.registrations.forEach(r => {
                        const cat = r.event?.category?.toLowerCase();
                        if (cat === 'technical') techCount++;
                        else if (cat === 'cultural') cultCount++;
                        else if (cat === 'seminar') semCount++;
                    });

                    const isMet = techCount >= 1 && cultCount >= 1 && semCount >= 1;
                    // setCriteriaMet(isMet); // Replaced with detailed object
                    setCriteria({ technical: techCount, cultural: cultCount, seminar: semCount, met: isMet });

                    // Find a master receipt ID if exists (usually the first registration can link to the master receipt page)
                    if (regsData.registrations.length > 0) {
                        setMasterReceiptId(regsData.registrations[0]._id);
                    }
                }
            } catch (error) {
                console.error("Error loading events page data:", error);
            }
        }
        loadData();
    }, []);

    // Helper to get events for a specific day
    const getEventsForDay = (day) => {
        return events.filter(event =>
            event.isPublished !== false &&
            ((event.activeDays || []).includes(day) || (event.activeDays || []).length === 0)
        );
    };

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
            {/* Dynamic Background Removed - Reverted to default globals.css background */}

            <div className="max-w-6xl mx-auto space-y-12 relative z-10">
                <div className="flex flex-col space-y-8">
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-white/5 pb-8">
                        <div className="space-y-2">
                            <div className="inline-block px-3 py-1 rounded-full bg-galaxy-purple/20 border border-galaxy-purple/30 text-galaxy-accent text-xs font-bold tracking-widest uppercase mb-2 animate-pulse">
                                Etamax 2026
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                EVENTS<span className="text-galaxy-purple">.</span>
                            </h1>
                            <p className="text-gray-400 text-lg max-w-md">
                                Explore the universe of technical, cultural, and seminar events planned for your journey.
                            </p>
                        </div>
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
                </div>


                {/* 1. Criteria Notification (Checklist) - AT THE TOP */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md mb-8">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Registration Progress</h3>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        {[
                            { label: 'Technical', count: criteria.technical, req: 1, icon: '🔧' },
                            { label: 'Cultural', count: criteria.cultural, req: 1, icon: '🎭' },
                            { label: 'Seminar', count: criteria.seminar, req: 1, icon: '🎤' },
                        ].map(item => (
                            <div key={item.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${item.count >= item.req ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                <span>{item.icon}</span>
                                <span className="text-sm font-bold">{item.label}</span>
                                <span className={`text-xs ${item.count >= item.req ? 'text-green-400' : 'text-gray-500'}`}>
                                    {item.count}/{item.req}
                                </span>
                                {item.count >= item.req && <span className="text-green-400">✓</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conditional Payment CTA - Glows when Criteria Met */}{/* Top Payment UI Removed - Relocated to Bottom */}

                {/* Day Accordions / Planet Timeline */}
                <div className="flex flex-col relative min-h-[500px]">
                    {[1, 2, 3].map(day => {
                        const dayEvents = getEventsForDay(day);
                        const isExpanded = expandedDay === day;

                        return (
                            <PlanetDayRow
                                key={day}
                                day={day}
                                events={dayEvents}
                                isExpanded={isExpanded}
                                onToggle={() => setExpandedDay(isExpanded ? null : day)}
                                activeDay={day}
                                expandedEventId={expandedEventId}
                                setExpandedEventId={setExpandedEventId}
                            />
                        );
                    })}
                </div>

                {/* Final Timeline Node: Simple Payment Button - AT THE BOTTOM */}
                <div className="relative pl-8 md:pl-16 py-8 md:py-12 animate-fade-in-up">
                    {/* Connecting Line from Day 3 */}
                    <div className="absolute left-[2.25rem] md:left-[4.25rem] -top-10 h-20 w-1 bg-gradient-to-b from-galaxy-purple/50 to-transparent z-0"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        {/* Simple Payment Button Container */}
                        <div className="w-full md:w-auto">
                            {criteria.met && masterReceiptId ? (
                                <Link
                                    href={`/receipt/${masterReceiptId}`}
                                    className="group relative w-full md:w-auto px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-white text-xl shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_rgba(16,185,129,0.8)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-4 overflow-hidden"
                                >
                                    <span className="relative z-10 uppercase tracking-widest">Make Payment</span>
                                    <div className="relative z-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">→</div>
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                </Link>
                            ) : (
                                <button disabled className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-gray-500 font-bold text-xl cursor-not-allowed flex items-center justify-center gap-3">
                                    <span>Make Payment</span>
                                    <span className="text-sm bg-white/10 px-2 py-1 rounded">Locked 🔒</span>
                                </button>
                            )}
                        </div>

                        {/* Helper Text */}
                        {!criteria.met && (
                            <p className="text-gray-500 text-sm md:text-base max-w-md">
                                *Complete at least 1 Technical, 1 Cultural, and 1 Seminar event to unlock payment.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

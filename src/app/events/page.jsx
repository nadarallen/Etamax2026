'use client';
import { useState, useEffect } from 'react';
import { logoutAction } from '@/server-actions/auth';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getEventsAction } from '@/server-actions/events';
import EventAccordion from '@/components/EventAccordion';
import PlanetDayRow from '@/components/PlanetDayRow';
import EventRegistrationModal from '@/components/EventRegistrationModal';
import AboutUsModal from '@/components/AboutUsModal';

import { getUserRegistrationsAction, getUserProfileAction } from '@/server-actions/user';


export default function EventsPage() {
    const router = useRouter();
    const [expandedDay, setExpandedDay] = useState(null);
    const [events, setEvents] = useState([]);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [userRegistrations, setUserRegistrations] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [aboutModalOpen, setAboutModalOpen] = useState(false);
    const [selectedEventForModal, setSelectedEventForModal] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
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
                const profile = await getUserProfileAction();

                if (profile) {
                    setUserProfile(profile);
                    // Security Check: Redirect Admins
                    if (['superadmin', 'clubadmin'].includes(profile.role)) {
                        router.replace('/admin');
                        return;
                    }
                }

                if (regsData.success) {
                    setUserRegistrations(regsData.registrations);

                    // 3. Calculate Criteria (Same logic as Event Detail)
                    // 3. Calculate Criteria (Case Insensitive)
                    let techCount = 0, cultCount = 0, semCount = 0;
                    const days = new Set();

                    regsData.registrations.forEach(r => {
                        if (r.status === 'CANCELLED') return;

                        const cat = r.event?.category?.toLowerCase();
                        if (cat === 'technical') techCount++;
                        else if (cat === 'cultural') cultCount++;
                        else if (cat === 'seminar') semCount++;

                        if (r.slot?.dayNumber) days.add(r.slot.dayNumber);
                    });

                    const isMet = techCount >= 1 && cultCount >= 1 && semCount >= 1 && days.has(1) && days.has(2) && days.has(3);
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
                            <button
                                onClick={() => setAboutModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all duration-300 border border-white/10 flex-1 md:flex-none"
                            >
                                <span className="font-medium text-sm whitespace-nowrap">About Us</span>
                            </button>
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
                                hasRegistration={userRegistrations.some(r => r.slot?.dayNumber === day && r.status !== 'CANCELLED')}
                                onEventClick={(event) => {
                                    setSelectedEventForModal(event);
                                    setModalOpen(true);
                                }}
                            />
                        );
                    })}
                </div>

                <EventRegistrationModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    event={selectedEventForModal}
                    userProfile={userProfile}
                    activeDay={expandedDay}
                />

                <AboutUsModal
                    isOpen={aboutModalOpen}
                    onClose={() => setAboutModalOpen(false)}
                />

                {/* Final Timeline Node: Simple Payment Button - AT THE BOTTOM */}
                <div className="relative pl-8 md:pl-16 py-8 md:py-12 animate-fade-in-up">
                    {/* Connecting Line from Day 3 */}
                    <div className="absolute left-[2.25rem] md:left-[4.25rem] -top-10 h-20 w-1 bg-gradient-to-b from-galaxy-purple/50 to-transparent z-0"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        {/* Two Buttons Container */}
                        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                            {criteria.met ? (
                                <>
                                    <Link
                                        href="/payment/confirm"
                                        className="group relative w-full md:w-auto px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-white text-xl shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_rgba(16,185,129,0.8)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-4 overflow-hidden"
                                    >
                                        <span className="relative z-10 flex flex-col items-center leading-none">
                                            <span className="uppercase tracking-widest text-lg">Pay Online</span>
                                            {(() => {
                                                const amt = userRegistrations
                                                    .filter(r => r.status === 'PENDING' || r.paymentStatus !== 'PAID')
                                                    .reduce((sum, r) => sum + (r.event?.price || 0), 0);
                                                return <span className="text-xs font-normal opacity-90 mt-1">{amt === 0 ? 'FREE' : `Amount: ₹${amt}`}</span>;
                                            })()}
                                        </span>
                                        <div className="relative z-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">→</div>
                                    </Link>

                                    <Link
                                        href="/payment/confirm"
                                        className="w-full md:w-auto px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <span>Pay Offline</span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <button disabled className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-gray-500 font-bold text-xl cursor-not-allowed flex items-center justify-center gap-3 opacity-60">
                                        <span>Pay Online</span>
                                        <span className="text-sm bg-white/10 px-2 py-1 rounded">Locked 🔒</span>
                                    </button>

                                    <Link
                                        href="/payment/confirm"
                                        className="w-full md:w-auto px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <span>Pay Offline</span>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Helper Text - Specific Missing Items */}
                        {!criteria.met && (
                            <div className="text-sm md:text-base max-w-md">
                                {(() => {
                                    const missing = [];
                                    if (criteria.technical < 1) missing.push('1 Technical Event');
                                    if (criteria.cultural < 1) missing.push('1 Cultural Event');
                                    if (criteria.seminar < 1) missing.push('1 Seminar');

                                    // Check days logic again here or rely on visual cues?
                                    // We need to fetch days from regs to be accurate here, but we don't have them easily accessible in this scope 
                                    // without re-running logic. luckily we have `userRegistrations`

                                    const days = new Set(userRegistrations.filter(r => r.status !== 'CANCELLED').map(r => r.slot?.dayNumber));
                                    if (!days.has(1)) missing.push('Day 1 Event');
                                    if (!days.has(2)) missing.push('Day 2 Event');
                                    if (!days.has(3)) missing.push('Day 3 Event');

                                    if (missing.length === 0) return <span className="text-green-400">Verifying eligibility...</span>;

                                    return (
                                        <p className="text-red-400 flex items-start gap-2">
                                            <span className="mt-1">🔒</span>
                                            <span>
                                                <strong>Payment Locked.</strong> Missing: {missing.join(', ')}.
                                                <br />
                                                <span className="text-gray-500 text-xs text-balance">Complete these to unlock online payment.</span>
                                            </span>
                                        </p>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Offline Modal */}

        </div>
    );
}

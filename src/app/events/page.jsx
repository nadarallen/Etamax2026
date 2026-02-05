'use client';
import { useState, useEffect } from 'react';
import { logoutAction } from '@/server-actions/auth';
import { LogOut, User, AlertCircle, CheckCircle } from 'lucide-react';
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
                            <div className="inline-block px-3 py-1 rounded-full bg-galaxy-purple/20 border border-galaxy-purple/30 text-white text-xs font-bold tracking-widest uppercase mb-2 animate-pulse">
                                ETAMAX 2026 | NAKSHATRA
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
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-galaxy-purple/10 hover:bg-galaxy-purple/20 text-white hover:text-white rounded-xl transition-all duration-300 border border-galaxy-purple/20 flex-1 md:flex-none"
                            >
                                <User size={18} />
                                <span className="font-medium text-sm whitespace-nowrap text-white">Confirm Payment</span>
                            </Link>
                            <button
                                onClick={async () => await logoutAction()}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 border border-red-500/20 flex-1 md:flex-none"
                            >
                                <LogOut size={18} />
                                <span className="font-medium text-sm text-red">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>


                {/* Day Accordions / Planet Timeline */}
                <div className="flex flex-col relative min-h-[500px]">
                    {/* Disclaimer checks */}
                    {/* Disclaimer checks */}
                    {criteria.met && (() => {
                        const hasPendingPayment = userRegistrations.some(r =>
                            (r.status === 'PENDING' || r.paymentStatus === 'PENDING') &&
                            r.status !== 'CANCELLED'
                        );

                        if (hasPendingPayment) {
                            return (
                                <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center gap-4 backdrop-blur-sm relative z-20">
                                    <div className="p-3 bg-yellow-500/20 rounded-full animate-pulse">
                                        <AlertCircle className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-yellow-400 font-bold text-lg">Almost there!</h3>
                                        <p className="text-yellow-200/80 text-sm md:text-base">
                                            <strong>Disclaimer:</strong> You have fulfilled all criteria. Please <Link href="/profile" className="text-white underline hover:text-yellow-300 font-bold decoration-auto underline-offset-4">go to your Profile</Link> to complete the payment to confirm your seats.
                                        </p>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-4 backdrop-blur-sm relative z-20">
                                <div className="p-3 bg-green-500/20 rounded-full animate-pulse">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-green-400 font-bold text-lg">You're all set!</h3>
                                    <p className="text-green-200/80 text-sm md:text-base">
                                        All registration criteria fulfilled and payments confirmed.
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

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


            </div>

            {/* Offline Modal */}

        </div>
    );
}

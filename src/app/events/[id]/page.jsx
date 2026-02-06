'use client';

import { useActionState, useEffect, useState, use } from 'react';
import { getEventByIdAction, getSlotsAction } from '@/server-actions/events';
import { registerForEventAction, cancelRegistrationAction } from '@/server-actions/registration';
import { getUserProfileAction } from '@/server-actions/user';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PlanetIcon from '@/components/PlanetIcon';
import JoinTeamModal from '@/components/JoinTeamModal';
import { ArrowLeft, Calendar, MapPin, Users, Trophy, CheckCircle, AlertCircle } from 'lucide-react';

const initialRegState = {
    error: '',
    success: false,
    message: ''
};

export default function EventDetail({ params }) {
    const resolvedParams = use(params);
    const eventId = resolvedParams.id;
    const searchParams = useSearchParams();
    const urlDay = parseInt(searchParams.get('day'));

    const [event, setEvent] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedDay, setSelectedDay] = useState(urlDay || 1);
    const [userProfile, setUserProfile] = useState(null);
    const [teamAction, setTeamAction] = useState('CREATE');
    const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);

    // Auto-open modal if register param is present
    useEffect(() => {
        if (searchParams.get('register') === 'true') {
            setShowEnrollModal(true);
        }
    }, [searchParams]);

    // Form State
    const [regState, formAction, isPending] = useActionState(registerForEventAction, initialRegState);

    const [criteriaMet, setCriteriaMet] = useState(false);
    const [regsCount, setRegsCount] = useState({ Technical: 0, Cultural: 0, Seminar: 0 });
    const [daysCovered, setDaysCovered] = useState(new Set());
    const [currentReg, setCurrentReg] = useState(null);

    // ... existing useActionState ...

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const getUserRegistrationsAction = (await import('@/server-actions/user')).getUserRegistrationsAction;

            const [ev, profile, regData] = await Promise.all([
                getEventByIdAction(eventId),
                getUserProfileAction(),
                getUserRegistrationsAction()
            ]);

            if (regData?.registrations) {
                const activeRegs = regData.registrations.filter(r => r.status !== 'CANCELLED');
                const counts = { Technical: 0, Cultural: 0, Seminar: 0 };
                const days = new Set();

                activeRegs.forEach(r => {
                    if (r.event?.category && counts[r.event.category] !== undefined) {
                        counts[r.event.category]++;
                    }
                    if (r.slot?.dayNumber) {
                        days.add(r.slot.dayNumber);
                    }
                });

                setRegsCount(counts);
                setDaysCovered(days);

                // Check for current event match
                const existing = activeRegs.find(r => r.eventId && (r.eventId === eventId || r.eventId._id === eventId));
                setCurrentReg(existing || null);

                // Criteria: 1 Tech, 1 Cult, 1 Sem, Day 1, Day 2, Day 3
                const met = counts.Technical >= 1 && counts.Cultural >= 1 && counts.Seminar >= 1 && days.has(1) && days.has(2) && days.has(3);
                setCriteriaMet(met);
            }

            if (ev) {
                // ... (rest of event loading logic)
                setEvent(ev);
                const s = await getSlotsAction(ev._id);
                setSlots(s);
                const days = [...new Set(s.map(slot => slot.dayNumber))].sort((a, b) => a - b);

                if (days.length > 0) {
                    const availableDay = days.find(day => {
                        const daySlots = s.filter(slot => slot.dayNumber === day);
                        return !daySlots.every(slot => {
                            const isTeam = ['duo', 'group'].includes(ev.type);
                            const cap = slot.maxCapacity || Infinity;
                            const count = isTeam ? (slot.teamsCount || 0) : (slot.registeredCount || 0);
                            return count >= cap;
                        });
                    });
                    if (urlDay && days.includes(urlDay)) setSelectedDay(urlDay);
                    else if (availableDay) setSelectedDay(availableDay);
                    else setSelectedDay(days[0]);
                }

                // Late Check: If this event fulfills the missing criteria? 
                // It's safer to just require 3 *existing* regs or allow "Pay Later" flow.
                // We'll stick to: Hide Payment if criteria not met.
            }

            if (profile) setUserProfile(profile);
            setLoading(false);
        }
        loadData();
    }, [eventId, urlDay]);

    const router = useRouter();

    // Close modal on success and Redirect
    // Close modal on success and Redirect
    useEffect(() => {
        if (regState?.success && regState?.registrationId) {
            router.push('/payment/confirm');
        }
    }, [regState, router]);

    if (loading) return <div className="min-h-screen pt-24 text-center text-white">Loading Event...</div>;
    if (!event) return <div className="min-h-screen pt-24 text-center text-white">Event not found</div>;

    const isFree = event.price === 0 || !event.price;

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 max-w-5xl mx-auto relative text-white">
            <Link href="/events" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back to Events
            </Link>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-galaxy-purple/20 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-galaxy-accent font-bold tracking-wider text-sm uppercase bg-galaxy-accent/10 px-3 py-1 rounded-full">{event.category} Event</span>
                            {isFree && <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">FREE ENTRY</span>}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-tight">{event.name}</h1>
                        <p className="text-xl text-gray-400">{event.club}</p>
                    </div>
                    <div className="mt-6 md:mt-0 flex flex-col items-end">
                        <div className="text-4xl font-bold text-white mb-2">{isFree ? 'Free' : `₹${event.price}`}</div>
                        <div className="text-sm text-gray-400">per person/team</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 text-gray-300 relative z-10">
                    <div className="flex flex-col items-center p-5 bg-black/20 rounded-2xl border border-white/5">
                        <Calendar className="mb-3 text-galaxy-accent" size={24} />
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-1">DATE</span>
                        <span className="text-base font-medium">
                            {slots.length > 0 ? `Day ${[...new Set(slots.map(s => s.dayNumber))].sort((a, b) => a - b).join(', ')}` : 'TBA'}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-5 bg-black/20 rounded-2xl border border-white/5">
                        <MapPin className="mb-3 text-galaxy-accent" size={24} />
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-1">VENUE</span>
                        <span className="text-base font-medium text-center">
                            {slots.length > 0 ? [...new Set(slots.map(s => s.venue))].join(', ') : 'TBA'}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-5 bg-black/20 rounded-2xl border border-white/5">
                        <Users className="mb-3 text-galaxy-accent" size={24} />
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-1">TYPE</span>
                        <span className="text-base font-medium capitalize">{event.type}</span>
                    </div>
                    {event.prizePool && (
                        <div className="flex flex-col items-center p-5 bg-black/20 rounded-2xl border border-white/5">
                            <Trophy className="mb-3 text-galaxy-accent" size={24} />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-1">PRIZE POOL</span>
                            <span className="text-base font-medium">{/^\d+$/.test(event.prizePool) ? `₹${event.prizePool}` : event.prizePool}</span>
                        </div>
                    )}
                </div>



                {/* Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-galaxy-dark/95 backdrop-blur-xl border-t border-white/10 z-50 md:sticky md:bottom-0 md:bg-transparent md:backdrop-blur-none md:border-0 md:p-0">
                    {/* Show Join Team button for group/duo events */}
                    {(event.type === 'group' || event.type === 'duo') && !currentReg ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEnrollModal(true)}
                                className="flex-1 bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
                            >
                                <span>Create Team</span>
                            </button>
                            <button
                                onClick={() => setShowJoinTeamModal(true)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
                            >
                                <Users size={20} />
                                <span>Join Team</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="w-full bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-3"
                        >
                            <span>{currentReg ? 'Manage Registration' : 'Reserve Seat'}</span>
                            <ArrowLeft className="rotate-180" size={20} />
                        </button>
                    )}
                    {/* Cancellation Status Indicator */}
                    {currentReg && (
                        <div className="text-center mt-2 text-xs text-green-400 font-bold bg-green-500/10 py-1 rounded-lg">
                            ✓ You have reserved a seat
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0f0f13] border border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                        <button
                            onClick={() => {
                                setShowEnrollModal(false);
                                // Reset state could be good here
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Reserve Seat for {event.name}</h2>

                        {regState.success ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Registration Successful!</h3>

                                {regState.paymentMethod === 'OFFLINE' ? (
                                    <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-left">
                                        <p className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                            <AlertCircle size={16} /> Payment Pending
                                        </p>
                                        <p className="text-gray-300 text-sm">
                                            Please proceed to the <strong>Offline Registration Desk</strong> to complete your payment correctly.
                                            Show the receipt below at the desk.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 mb-6">{regState.message}</p>
                                )}

                                <div className="flex gap-3 justify-center">
                                    <Link href={`/receipt/${regState.registrationId}`}>
                                        <button className="bg-galaxy-purple hover:bg-galaxy-purple/90 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-galaxy-purple/20">
                                            View Receipt
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => setShowEnrollModal(false)}
                                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form action={formAction} className="space-y-4">
                                <input type="hidden" name="eventId" value={event._id} />

                                {/* Team Selection Logic */}
                                {['duo', 'group'].includes(event.type) && (
                                    <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Team Registration</label>

                                        <div className="flex bg-black/40 p-1 rounded-lg mb-4">
                                            <button
                                                type="button"
                                                onClick={() => setTeamAction('CREATE')}
                                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${teamAction === 'CREATE' ? 'bg-galaxy-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Create Team
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTeamAction('JOIN')}
                                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${teamAction === 'JOIN' ? 'bg-galaxy-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Join Team
                                            </button>
                                        </div>

                                        <input type="hidden" name="teamAction" value={teamAction} />

                                        {teamAction === 'CREATE' ? (
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Team Name</label>
                                                <input
                                                    name="teamName"
                                                    type="text"
                                                    placeholder="Enter Team Name"
                                                    required={teamAction === 'CREATE'}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple outline-none"
                                                />
                                                <p className="text-[10px] text-gray-500 mt-1">You will get a team code after registration to share.</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Team Code</label>
                                                <input
                                                    name="teamCode"
                                                    type="text"
                                                    placeholder="Enter 6-digit Code"
                                                    required={teamAction === 'JOIN'}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple outline-none uppercase tracking-widest"
                                                    maxLength={6}
                                                />
                                                <p className="text-[10px] text-gray-500 mt-1">Ask your team leader for the code.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Slot Selection */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Select Slot</label>

                                    {/* Day Tabs */}
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {[...new Set(slots.map(s => s.dayNumber))].sort((a, b) => a - b).map(day => {
                                            const daySlots = slots.filter(s => s.dayNumber === day);
                                            // Check if EVERY slot in this day is full. Safety checks for cap.
                                            const isDaySoldOut = daySlots.length > 0 && daySlots.every(s => {
                                                const isTeam = ['duo', 'group'].includes(event.type);
                                                const cap = s.maxCapacity || 9999;
                                                const count = isTeam ? (s.teamsCount || 0) : (s.registeredCount || 0);
                                                return count >= cap;
                                            });

                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => setSelectedDay(day)}
                                                    className={`pl-2 pr-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-3 ${selectedDay === day
                                                        ? 'bg-galaxy-purple text-white border-galaxy-purple shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                                                        : isDaySoldOut
                                                            ? 'bg-red-500/10 text-red-500 border-red-500/20 opacity-80'
                                                            : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                                                        }`}
                                                >
                                                    <PlanetIcon day={day} />
                                                    <span>Day {day}</span>
                                                    {isDaySoldOut && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider ml-1">Full</span>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Slot Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {slots.filter(s => s.dayNumber === selectedDay).map(slot => {
                                            const isTeam = ['duo', 'group'].includes(event.type);
                                            const currentCount = isTeam ? (slot.teamsCount || 0) : (slot.registeredCount || 0);
                                            const maxCap = slot.maxCapacity || 1;

                                            const percentFull = (currentCount / maxCap) * 100;
                                            const isFull = percentFull >= 100;
                                            const isFastFilling = !isFull && percentFull >= 80;
                                            const isSelected = selectedSlot?._id === slot._id;

                                            // Determine Border/Text Color based on status
                                            let statusColorClass = 'border-green-500/30 text-green-400'; // Default Green
                                            if (isFull) statusColorClass = 'border-red-500/30 text-red-400 cursor-not-allowed opacity-60';
                                            else if (isFastFilling) statusColorClass = 'border-yellow-500/30 text-yellow-400';

                                            if (isSelected) statusColorClass = 'border-galaxy-purple bg-galaxy-purple/10';

                                            return (
                                                <label
                                                    key={slot._id}
                                                    className={`
                                                        relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all h-full
                                                        ${statusColorClass}
                                                        ${!isFull ? 'cursor-pointer hover:border-opacity-60 active:scale-95' : ''}
                                                        ${isSelected ? 'shadow-[0_0_15px_rgba(124,58,237,0.2)]' : 'bg-white/5'}
                                                    `}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="slotId"
                                                        value={slot._id}
                                                        checked={isSelected}
                                                        disabled={isFull}
                                                        onChange={() => !isFull && setSelectedSlot(slot)}
                                                        className="sr-only"
                                                    />
                                                    <div className="font-bold text-sm mb-1">{slot.startTime} - {slot.endTime}</div>
                                                    <div className="text-[10px] uppercase font-bold tracking-wider mb-0 opacity-80">
                                                        {isFull ? 'SOLD OUT' : (isFastFilling ? 'FILLING FAST' : 'AVAILABLE')}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {!selectedSlot && <p className="text-xs text-red-400 mt-2">Please select a time slot</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                    <input
                                        name="fullName"
                                        type="text"
                                        required
                                        defaultValue={regState?.payload?.fullName || userProfile?.fullName || ''}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple outline-none transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Roll Number</label>
                                    <input
                                        name="rollNumber"
                                        type="text"
                                        required
                                        defaultValue={regState?.payload?.rollNumber || userProfile?.rollNumber || ''}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple outline-none transition-colors"
                                        placeholder="12345"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        defaultValue={regState?.payload?.email || userProfile?.email || ''}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple outline-none transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Branch</label>
                                    <select
                                        name="branch"
                                        required
                                        defaultValue={regState?.payload?.branch || userProfile?.branch || ''}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple outline-none transition-colors [&>option]:bg-black"
                                    >
                                        <option value="" disabled>Select Branch</option>
                                        <option value="COMPS">COMPS (Computer Engineering)</option>
                                        <option value="CSE/IT">CSE/IT (Computer Science & Engg/IT)</option>
                                        <option value="MECH">MECH (Mechanical Engineering)</option>
                                        <option value="ELECT">ELECT (Electrical Engineering)</option>
                                        <option value="EXTC">EXTC (Electronics & Telecomm)</option>
                                        <option value="BSH">BSH (Basic Sciences & Humanities)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Semester</label>
                                    <input
                                        name="semester"
                                        type="text"
                                        required
                                        defaultValue={regState?.payload?.semester || userProfile?.semester || ''}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple outline-none transition-colors"
                                        placeholder="e.g. 5"
                                    />
                                </div>

                                {regState?.error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold mb-4 flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {regState.error}
                                    </div>
                                )}

                                {/* Buttons Container */}
                                <div className="mt-8 flex flex-col gap-3">
                                    {isFree || teamAction === 'JOIN' ? (
                                        <button
                                            type="submit"
                                            name="paymentMethod"
                                            value="FREE" // Or handled by server
                                            disabled={isPending || !selectedSlot}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                                        >
                                            {isPending ? 'Processing...' : 'Confirm Registration'}
                                        </button>
                                    ) : (
                                        <>
                                            {criteriaMet && (
                                                <button
                                                    type="submit"
                                                    name="paymentMethod"
                                                    value="ONLINE"
                                                    disabled={isPending || !selectedSlot}
                                                    className="w-full bg-galaxy-purple hover:bg-galaxy-purple/90 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isPending ? 'Processing...' : 'Pay Online'} <ArrowLeft className="rotate-180" size={18} />
                                                </button>
                                            )}

                                            <button
                                                type="submit"
                                                name="paymentMethod"
                                                value="OFFLINE"
                                                disabled={isPending || !selectedSlot}
                                                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl border border-white/10 transition-all"
                                            >
                                                {isPending ? 'Processing...' : 'Reserve Seat'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Join Team Modal */}
            <JoinTeamModal
                event={event}
                isOpen={showJoinTeamModal}
                onClose={() => setShowJoinTeamModal(false)}
                onSuccess={() => {
                    setShowJoinTeamModal(false);
                    // Reload will happen in modal
                }}
            />
        </div>
    );
}

'use client';

import { useActionState, useEffect, useState, use } from 'react';
import { getEventByIdAction, getSlotsAction } from '@/server-actions/events';
import { registerForEventAction } from '@/server-actions/registration';
import { getUserProfileAction } from '@/server-actions/user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, Trophy, CheckCircle, AlertCircle } from 'lucide-react';

const initialRegState = {
    error: '',
    success: false,
    message: ''
};

export default function EventDetail({ params }) {
    const resolvedParams = use(params);
    const eventId = resolvedParams.id;

    const [event, setEvent] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // Form State
    const [regState, formAction, isPending] = useActionState(registerForEventAction, initialRegState);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [ev, profile] = await Promise.all([
                getEventByIdAction(eventId),
                getUserProfileAction()
            ]);

            if (ev) {
                setEvent(ev);
                // Fetch slots using the actual _id from the fetched event
                const s = await getSlotsAction(ev._id);
                setSlots(s);
                // Auto-select slot if only one
                if (s.length === 1) setSelectedSlot(s[0]);
            }
            if (profile) {
                setUserProfile(profile);
            }
            setLoading(false);
        }
        loadData();
    }, [eventId]);

    const router = useRouter();

    // Close modal on success and Redirect to Receipt
    useEffect(() => {
        if (regState?.success && regState?.registrationId) {
            router.push(`/receipt/${regState.registrationId}`);
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
                            {slots.length > 0 ? `Day ${slots.map(s => s.dayNumber).join(', ')}` : 'TBA'}
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
                            <span className="text-base font-medium">{event.prizePool}</span>
                        </div>
                    )}
                </div>

                <div className="mb-12 relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-1 h-8 bg-galaxy-purple rounded-full"></span>
                        About the Event
                    </h3>
                    <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-line text-lg">
                        {event.description}
                    </div>
                </div>

                {/* Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-galaxy-dark/95 backdrop-blur-xl border-t border-white/10 z-50 md:sticky md:bottom-0 md:bg-transparent md:backdrop-blur-none md:border-0 md:p-0">
                    <button
                        onClick={() => setShowEnrollModal(true)}
                        className="w-full bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl text-lg shadow-[0_0_30px_rgba(123,92,255,0.3)] transition-all duration-300 active:scale-95 flex justify-center items-center gap-3"
                    >
                        <span>Enroll Now</span>
                        <ArrowLeft className="rotate-180" size={20} />
                    </button>
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

                        <h2 className="text-2xl font-bold text-white mb-6">Register for {event.name}</h2>

                        {regState.success ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Registration Successful!</h3>
                                <p className="text-gray-400 mb-6">{regState.message}</p>
                                <button
                                    onClick={() => setShowEnrollModal(false)}
                                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form action={formAction} className="space-y-4">
                                <input type="hidden" name="eventId" value={event._id} />

                                {/* Slot Selection */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Select Slot</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {slots.map(slot => (
                                            <label key={slot._id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedSlot?._id === slot._id ? 'bg-galaxy-purple/20 border-galaxy-purple' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="slotId"
                                                        value={slot._id}
                                                        checked={selectedSlot?._id === slot._id}
                                                        onChange={() => setSelectedSlot(slot)}
                                                        className="accent-galaxy-purple"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-white">Day {slot.dayNumber}</div>
                                                        <div className="text-xs text-gray-400">{slot.startTime} - {slot.endTime}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                                                    {slot.venue}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {!selectedSlot && <p className="text-xs text-red-400 mt-1">Please select a slot</p>}
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

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Payment Option</label>
                                    {isFree ? (
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-medium flex items-center gap-2">
                                            <CheckCircle size={16} /> Free Entry
                                            <input type="hidden" name="paymentMethod" value="FREE" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="cursor-pointer">
                                                <input type="radio" name="paymentMethod" value="ONLINE" className="peer sr-only" />
                                                <div className="p-3 rounded-xl border border-white/10 bg-white/5 peer-checked:border-galaxy-purple peer-checked:bg-galaxy-purple/10 text-center transition-all">
                                                    <div className="font-bold text-white text-sm">Pay Online</div>
                                                    <div className="text-[10px] text-gray-400">UPI / Card</div>
                                                </div>
                                            </label>
                                            <label className="cursor-pointer">
                                                <input type="radio" name="paymentMethod" value="OFFLINE" defaultChecked className="peer sr-only" />
                                                <div className="p-3 rounded-xl border border-white/10 bg-white/5 peer-checked:border-galaxy-purple peer-checked:bg-galaxy-purple/10 text-center transition-all">
                                                    <div className="font-bold text-white text-sm">Pay Offline</div>
                                                    <div className="text-[10px] text-gray-400">Cash at Desk</div>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {regState?.error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle size={16} /> {regState.error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isPending || !selectedSlot}
                                    className="w-full bg-galaxy-purple hover:bg-galaxy-purple/90 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 mt-4"
                                >
                                    {isPending ? 'Processing...' : (isFree ? 'Confirm Registration' : 'Proceed to Payment')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

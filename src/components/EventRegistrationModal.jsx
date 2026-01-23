'use client';

import { useActionState, useEffect, useState } from 'react';
import { getSlotsAction } from '@/server-actions/events';
import { registerForEventAction } from '@/server-actions/registration';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlanetIcon from '@/components/PlanetIcon';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const initialRegState = {
    error: '',
    success: false,
    message: ''
};

export default function EventRegistrationModal({ event, isOpen, onClose, userProfile, activeDay }) {
    const router = useRouter();
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Form State
    const [regState, formAction, isPending] = useActionState(registerForEventAction, initialRegState);

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedDay, setSelectedDay] = useState(activeDay || 1);
    const [teamAction, setTeamAction] = useState('CREATE');

    // Fetch slots when modal opens
    useEffect(() => {
        if (isOpen && event?._id) {
            setLoadingSlots(true);
            getSlotsAction(event._id).then(s => {
                setSlots(s);
                // Pre-select day if provided, or first available
                const days = [...new Set(s.map(slot => slot.dayNumber))].sort((a, b) => a - b);
                if (activeDay && days.includes(activeDay)) {
                    setSelectedDay(activeDay);
                } else if (days.length > 0) {
                    setSelectedDay(days[0]);
                }
                setLoadingSlots(false);
            });
        }
    }, [isOpen, event, activeDay]);

    // Close modal on success and Redirect
    useEffect(() => {
        if (regState?.success) {
            // Optional: wait a bit or let user click button
        }
    }, [regState]);

    if (!isOpen) return null;

    const isFree = event.price === 0 || !event.price;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f0f13] border border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Reserve Seat for <span className="text-galaxy-purple">{event.name}</span></h2>

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
                            <button
                                onClick={() => router.push('/payment/confirm')}
                                className="bg-galaxy-purple hover:bg-galaxy-purple/90 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-galaxy-purple/20"
                            >
                                Continue
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <form action={formAction} className="space-y-5">
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
                            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Select Slot</label>

                            {loadingSlots ? (
                                <div className="text-sm text-gray-500 animate-pulse">Loading slots...</div>
                            ) : (
                                <>
                                    {/* Day Tabs */}
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                                        {[...new Set(slots.map(s => s.dayNumber))].sort((a, b) => a - b).map(day => {
                                            const daySlots = slots.filter(s => s.dayNumber === day);
                                            // Check day sold out
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
                                    <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
                                        {slots.filter(s => s.dayNumber === selectedDay).map(slot => {
                                            const isTeam = ['duo', 'group'].includes(event.type);
                                            const currentCount = isTeam ? (slot.teamsCount || 0) : (slot.registeredCount || 0);
                                            const maxCap = slot.maxCapacity || 1;

                                            const percentFull = (currentCount / maxCap) * 100;
                                            const isFull = percentFull >= 100;
                                            const isFastFilling = !isFull && percentFull >= 80;
                                            const isSelected = selectedSlot?._id === slot._id;

                                            // Determine Border/Text Color based on status
                                            let statusColorClass = 'border-green-500/30 text-green-400';
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
                                        {slots.filter(s => s.dayNumber === selectedDay).length === 0 && (
                                            <p className="col-span-2 text-sm text-gray-500 text-center py-4">No slots available for Day {selectedDay}</p>
                                        )}
                                    </div>
                                    {!selectedSlot && <p className="text-xs text-red-400 mt-2">Please select a time slot</p>}
                                </>
                            )}
                        </div>

                        {/* User Details */}
                        <div className="space-y-4">
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

                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        defaultValue={regState?.payload?.email || userProfile?.email || ''}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple outline-none transition-colors"
                                        placeholder="email@example.com"
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
                                        <option value="COMPS">COMPS</option>
                                        <option value="CSE/IT">CSE/IT</option>
                                        <option value="MECH">MECH</option>
                                        <option value="ELECT">ELECT</option>
                                        <option value="EXTC">EXTC</option>
                                        <option value="BSH">BSH</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {regState?.error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold flex items-center gap-2">
                                <AlertCircle size={16} />
                                {regState.error}
                            </div>
                        )}

                        {/* Submit Actions */}
                        <div className="mt-4 pt-4 border-t border-white/5">
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
                                <button
                                    type="submit"
                                    name="paymentMethod"
                                    value="OFFLINE"
                                    disabled={isPending || !selectedSlot}
                                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    {isPending ? 'Propelling...' : 'Reserve Seat'}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

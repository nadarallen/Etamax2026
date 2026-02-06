'use client';

import { useActionState, useEffect, useState } from 'react';
import { getSlotsAction } from '@/server-actions/events';
import { registerForEventAction } from '@/server-actions/registration';
import { getUserRegistrationsAction } from '@/server-actions/user';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertCircle, Lock, Check, XCircle } from 'lucide-react';
import PlanetIcon from './PlanetIcon';

const initialRegState = {
    error: '',
    success: false,
    message: ''
};

export default function EventRegistrationModal({ event, isOpen, onClose, userProfile, activeDay }) {
    const router = useRouter();
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [latestRegistrations, setLatestRegistrations] = useState([]);
    const [criteriaLoading, setCriteriaLoading] = useState(false);

    // Form State
    const [regState, formAction, isPending] = useActionState(registerForEventAction, initialRegState);

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedDay, setSelectedDay] = useState(activeDay || 1);
    const [teamAction, setTeamAction] = useState('CREATE');

    const [eligibilityChecked, setEligibilityChecked] = useState(false);

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
            if (regState.registrations) {
                // Use optimized data from server action
                setLatestRegistrations(regState.registrations);
            } else {
                // Fallback: Fetch latest registrations
                setCriteriaLoading(true);
                getUserRegistrationsAction().then(res => {
                    if (res.registrations) {
                        setLatestRegistrations(res.registrations);
                    }
                    setCriteriaLoading(false);
                });
            }
        }
    }, [regState]);

    // Check criteria and auto-reload to show global popup
    useEffect(() => {
        if (regState.success && latestRegistrations.length > 0) {
            const activeRegs = latestRegistrations.filter(r => r.status && r.status !== 'CANCELLED');
            let techCount = 0, cultCount = 0, semCount = 0;
            const days = new Set();
            activeRegs.forEach(r => {
                const cat = r.event?.category?.toLowerCase();
                if (cat === 'technical') techCount++;
                else if (cat === 'cultural') cultCount++;
                else if (cat === 'seminar') semCount++;
                if (r.slot?.dayNumber) days.add(r.slot.dayNumber);
            });
            const hasTeam = activeRegs.some(r => r.event?.type !== 'solo');

            const missing = [];
            if (techCount < 1) missing.push('tech');
            if (cultCount < 1) missing.push('cult');
            if (semCount < 1) missing.push('sem');
            if (!days.has(1)) missing.push('d1');
            if (!days.has(2)) missing.push('d2');
            if (!days.has(3)) missing.push('d3');
            if (!hasTeam) missing.push('team');

            if (missing.length === 0) {
                // Criteria Met! Reload to trigger global popup.
                window.location.reload();
            } else {
                // Criteria NOT met yet. Show local success modal.
                setEligibilityChecked(true);
            }
        }
    }, [regState.success, latestRegistrations]);

    if (!isOpen) return null;

    const isFree = event.price === 0 || !event.price;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f0f13] border border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                    onClick={() => {
                        if (regState?.success) {
                            window.location.reload();
                        } else {
                            onClose();
                        }
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Reserve Seat for <span className="text-galaxy-purple">{event.name}</span></h2>

                {regState.success ? (
                    !eligibilityChecked ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-galaxy-purple border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 animate-pulse">Verifying eligibility...</p>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Registration Successful!</h3>

                            {criteriaLoading ? (
                                <p className="text-gray-400 mb-6">Updating your progress...</p>
                            ) : (
                                (() => {
                                    // Calculate Missing
                                    const activeRegs = latestRegistrations.filter(r => r.status && r.status !== 'CANCELLED');
                                    let techCount = 0, cultCount = 0, semCount = 0;
                                    const days = new Set();
                                    activeRegs.forEach(r => {
                                        const cat = r.event?.category?.toLowerCase();
                                        if (cat === 'technical') techCount++;
                                        else if (cat === 'cultural') cultCount++;
                                        else if (cat === 'seminar') semCount++;
                                        if (r.slot?.dayNumber) days.add(r.slot.dayNumber);
                                    });

                                    const missing = [];
                                    if (techCount < 1) missing.push({ label: '1 Technical Event', type: 'category' });
                                    if (cultCount < 1) missing.push({ label: '1 Cultural Event', type: 'category' });
                                    if (semCount < 1) missing.push({ label: '1 Seminar', type: 'category' });
                                    if (!days.has(1)) missing.push({ label: 'Day 1 Event', type: 'day' });
                                    if (!days.has(2)) missing.push({ label: 'Day 2 Event', type: 'day' });
                                    if (!days.has(3)) missing.push({ label: 'Day 3 Event', type: 'day' });

                                    if (missing.length === 0) {
                                        // Should not reach here due to parent logic check, but safe fallback
                                        return null;
                                    } else {
                                        return (
                                            <div className="mb-6 bg-galaxy-purple/10 border border-galaxy-purple/20 p-5 rounded-xl text-left">
                                                <p className="text-white font-bold mb-3 flex items-center gap-2">
                                                    <Lock size={16} className="text-yellow-400" /> Unlock Payment
                                                </p>
                                                <p className="text-gray-400 text-sm mb-3">
                                                    Great start! To unlock online payment, you need to complete the following:
                                                </p>
                                                <div className="space-y-2">
                                                    {missing.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm text-yellow-200/80">
                                                            <XCircle size={16} className="text-red-500 shrink-0" />
                                                            <span className="text-gray-300 font-medium">{item.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500">
                                                    * Register for more events to fulfil these criteria.
                                                </div>
                                            </div>
                                        );
                                    }
                                })()
                            )}

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-colors w-full"
                                >
                                    Browse More Events
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    <form action={formAction} className="space-y-5">
                        <input type="hidden" name="eventId" value={event._id} />

                        {/* Team Selection Logic */}
                        {(['duo', 'group'].includes(event?.type?.toLowerCase()) || (event?.minTeamSize > 1)) && (
                            <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Team Registration</label>

                                <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-xl mb-6 relative">
                                    <button
                                        type="button"
                                        onClick={() => setTeamAction('CREATE')}
                                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all relative z-10 flex items-center justify-center gap-2 ${teamAction === 'CREATE' ? 'bg-galaxy-purple text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Create Team
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTeamAction('JOIN')}
                                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all relative z-10 flex items-center justify-center gap-2 ${teamAction === 'JOIN' ? 'bg-galaxy-purple text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
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
                                                const isTeam = ['duo', 'group'].includes(event?.type?.toLowerCase()) || (event?.minTeamSize > 1);
                                                const cap = s.maxCapacity || 9999;
                                                const count = isTeam ? (s.teamsCount || 0) : (s.registeredCount || 0);

                                                // FIXED: If joining a team, capacity doesn't matter for the slot itself
                                                if (teamAction === 'JOIN' && isTeam) return false;

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

                                    <div className="grid grid-cols-2 gap-3">
                                        {slots.filter(s => s.dayNumber === selectedDay).map(slot => {
                                            const isTeam = ['duo', 'group'].includes(event?.type?.toLowerCase()) || (event?.minTeamSize > 1);
                                            const currentCount = isTeam ? (slot.teamsCount || 0) : (slot.registeredCount || 0);
                                            const maxCap = slot.maxCapacity || 1;

                                            const percentFull = (currentCount / maxCap) * 100;
                                            const isFull = percentFull >= 100;
                                            const isFastFilling = !isFull && percentFull >= 80;
                                            const isSelected = selectedSlot?._id === slot._id;

                                            // FIXED: Block only if CREATE or SOLO. Join ignores slot capacity.
                                            const isBlocked = isFull && (teamAction !== 'JOIN' || !isTeam);

                                            // Determine Border/Text Color based on status
                                            let statusColorClass = 'border-white/10 text-gray-400 bg-white/5';
                                            if (isBlocked) statusColorClass = 'border-red-500/30 text-red-400 cursor-not-allowed opacity-60 bg-red-500/5';
                                            else if (isFastFilling) statusColorClass = 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5';

                                            if (isSelected) statusColorClass = 'border-galaxy-purple bg-galaxy-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] scale-[1.02] z-10';

                                            return (
                                                <label
                                                    key={slot._id}
                                                    className={`
                                                        relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all h-full
                                                        ${statusColorClass}
                                                        ${!isBlocked && !isSelected ? 'cursor-pointer hover:border-white/30 hover:bg-white/10 active:scale-95' : ''}
                                                    `}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="slotId"
                                                        value={slot._id}
                                                        checked={isSelected}
                                                        disabled={isBlocked}
                                                        onChange={() => { }} /* Handled by onClick for toggle behavior */
                                                        onClick={() => {
                                                            if (!isBlocked) {
                                                                if (isSelected) {
                                                                    setSelectedSlot(null);
                                                                } else {
                                                                    setSelectedSlot(slot);
                                                                }
                                                            }
                                                        }}
                                                        className="sr-only"
                                                    />
                                                    {isSelected && <div className="absolute top-2 right-2"><CheckCircle size={14} className="text-white" /></div>}
                                                    <div className="font-bold text-sm mb-1">{slot.startTime} - {slot.endTime}</div>
                                                    <div className={`text-[10px] uppercase font-bold tracking-wider mb-0 ${isSelected ? 'text-white/80' : 'opacity-80'}`}>
                                                        {isBlocked ? 'SOLD OUT' : (isFull ? 'JOIN ONLY' : (isFastFilling ? 'FILLING FAST' : 'AVAILABLE'))}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                        {slots.filter(s => s.dayNumber === selectedDay).length === 0 && (
                                            <p className="col-span-2 text-sm text-gray-500 text-center py-4">No slots available for Day {selectedDay}</p>
                                        )}
                                    </div>

                                    {selectedSlot ? (
                                        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                                    <Check size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-green-400 uppercase font-bold tracking-wider">Selected Slot</p>
                                                    <p className="text-white font-bold text-sm">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-green-500 font-bold px-2 py-1 bg-green-500/10 rounded">Day {selectedDay}</span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5 font-medium">
                                            <AlertCircle size={12} /> Please select a time slot to proceed
                                        </p>
                                    )}
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

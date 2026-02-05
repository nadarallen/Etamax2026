import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trophy, Cpu, Music, Mic2, Award, Lock, Unlock, Calendar, Users } from 'lucide-react';

export default function CriteriaProgress({ registrations }) {
    // Logic: User needs:
    // 1. One Event for Day 1, Day 2, Day 3
    // 2. One Technical, One Cultural, One Seminar
    // 3. At least one Team Event
    // Validated against `registrations` which contains { event: { category, type }, slot: { dayNumber } }

    const activeRegs = registrations.filter(r => r.status !== 'CANCELLED');
    const categories = new Set(activeRegs.map(r => r.event?.category?.toLowerCase()));
    const days = new Set(activeRegs.map(r => r.slot?.dayNumber));

    // Check for team events with actual teams that have members
    // A team event is valid only if:
    // 1. Event type is 'group' (not solo)
    // 2. User has a team (teamId exists)
    // 3. Team has at least 1 member (including the user)
    // 4. Team leader has paid (all members marked as PAID)
    const teamEventReg = activeRegs.find(r =>
        r.event?.type === 'group' &&
        r.team &&
        r.team.memberCount >= 1
    );

    const hasTeamEvent = !!teamEventReg;

    // Check if team leader has paid (team status is CONFIRMED)
    const isTeamPaid = teamEventReg?.team?.status === 'CONFIRMED' || teamEventReg?.status === 'CONFIRMED';

    // Get team payment description
    const getTeamDesc = () => {
        if (!hasTeamEvent) return 'Join 1 Team Event';
        if (isTeamPaid) return 'Team Leader Paid ✓';
        return 'Waiting for Leader Payment';
    };

    /* ... criteria definition ... */
    const criteria = [
        // Categories
        { id: 'technical', label: 'Technical', icon: <Cpu size={18} />, desc: 'Register for 1 Tech event' },
        { id: 'cultural', label: 'Cultural', icon: <Music size={18} />, desc: 'Register for 1 Cultural event' },
        { id: 'seminar', label: 'Seminar', icon: <Mic2 size={18} />, desc: 'Attend 1 Seminar' },
        // Team Requirement - Dynamic description based on payment status
        { id: 'team_participation', label: 'Team Player', icon: <Users size={18} />, desc: getTeamDesc() },
        // Days
        { id: 'Day 1', label: 'Day 1', icon: <Calendar size={18} />, desc: 'Event on Day 1' },
        { id: 'Day 2', label: 'Day 2', icon: <Calendar size={18} />, desc: 'Event on Day 2' },
        { id: 'Day 3', label: 'Day 3', icon: <Calendar size={18} />, desc: 'Event on Day 3' },
    ];

    const filledCriteria = criteria.map(c => {
        if (c.id === 'team_participation') return hasTeamEvent && isTeamPaid;
        if (c.id.startsWith('Day')) {
            const d = parseInt(c.id.split(' ')[1]);
            return days.has(d);
        }
        return categories.has(c.id);
    });

    const completedCount = filledCriteria.filter(Boolean).length;
    const isComplete = completedCount === criteria.length;
    const progressPercentage = (completedCount / criteria.length) * 100;

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const pathname = global?.window?.location?.pathname || '';

    useEffect(() => {
        // Validation: Logic to show popup ONLY when transitioning to complete state
        // or if not yet seen.
        if (isComplete) {
            const hasSeen = localStorage.getItem('etamax_criteria_seen');

            // Suppress on Profile AND Payment pages
            const isExcludedPage = pathname.includes('/profile') || pathname.includes('/payment');

            if (!hasSeen && !isExcludedPage) {
                setShowPaymentModal(true);
                localStorage.setItem('etamax_criteria_seen', 'true');
            }
        } else {
            // Reset if they cancel registration and fall below completion
            // So they can see it again when they re-complete.
            localStorage.removeItem('etamax_criteria_seen');
        }
    }, [isComplete, pathname]);

    return (
        <>
            <div className="relative group overflow-hidden bg-[#0f0f13] rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8 mb-10">
                {/* Ambient Background Elements */}
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-galaxy-purple/10 to-blue-600/10 blur-[80px] rounded-full transition-opacity duration-1000 ${isComplete ? 'opacity-100' : 'opacity-50'}`}></div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 items-center">

                    {/* Left Side: Status & Details */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${isComplete ? 'bg-galaxy-accent/20 text-galaxy-accent' : 'bg-gray-800 text-gray-400'}`}>
                                <Award size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-wide">
                                    Participation Criteria
                                </h3>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
                                    Eligibility Tracker
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {criteria.map((item) => {
                                let isDone = false;
                                if (item.id === 'team_participation') {
                                    isDone = hasTeamEvent && isTeamPaid; // Require both team AND payment
                                } else if (item.id.startsWith('Day')) {
                                    const d = parseInt(item.id.split(' ')[1]);
                                    isDone = days.has(d);
                                } else {
                                    isDone = categories.has(item.id);
                                }
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group/item ${isDone
                                            ? 'bg-gradient-to-r from-green-500/10 to-transparent border-green-500/20'
                                            : 'bg-white/5 border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400'
                                                }`}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold text-sm ${isDone ? 'text-white' : 'text-gray-300'}`}>
                                                    {item.label}
                                                </h4>
                                                <p className="text-xs text-gray-500">{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className={`transition-transform duration-300 ${isDone ? 'scale-110 text-green-400' : 'text-gray-600'}`}>
                                            {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Side: Circular Progress */}
                    <div className="flex flex-col items-center justify-center border-l border-white/5 pl-0 md:pl-8 pt-6 md:pt-0">
                        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                            {/* Background Circle */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" strokeWidth="8" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke={isComplete ? '#4ade80' : '#3b82f6'}
                                    strokeWidth="8"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (283 * progressPercentage) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>

                            <div className="text-center">
                                <span className={`text-4xl font-bold block ${isComplete ? 'text-green-400' : 'text-white'}`}>
                                    {Math.round(progressPercentage)}%
                                </span>
                                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Completed</span>
                            </div>
                        </div>

                        <div className={`text-center transition-all duration-500 ${isComplete ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-2'}`}>
                            {isComplete ? (
                                <div className="flex flex-col items-center">
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30 mb-2">
                                        <Unlock size={12} /> CRITERIA FULFILLED
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800 text-gray-400 text-xs font-bold border border-gray-700/50 mb-2">
                                        <Lock size={12} /> LOCKED
                                    </span>
                                    <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                                        Complete all criteria to unlock your participation certificate.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

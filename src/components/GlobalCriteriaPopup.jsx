'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getUserRegistrationsAction } from '@/server-actions/user';
import { CheckCircle2, Users } from 'lucide-react';

export default function GlobalCriteriaPopup() {
    const pathname = usePathname();
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        async function checkCriteria() {
            try {
                // Fetch registrations
                const res = await getUserRegistrationsAction();
                if (res.success && res.registrations) {
                    const activeRegs = res.registrations.filter(r => r.status && r.status !== 'CANCELLED');

                    // Logic duplication from CriteriaProgress (safe for now)
                    const categories = new Set(activeRegs.map(r => r.event?.category?.toLowerCase()));
                    const days = new Set(activeRegs.map(r => r.slot?.dayNumber));
                    const hasTeamEvent = activeRegs.some(r => r.event?.type !== 'solo');

                    const criteria = [
                        { id: 'technical', label: 'Technical' },
                        { id: 'cultural', label: 'Cultural' },
                        { id: 'seminar', label: 'Seminar' },
                        { id: 'team_participation', label: 'Team Player' },
                        { id: 'Day 1', label: 'Day 1' },
                        { id: 'Day 2', label: 'Day 2' },
                        { id: 'Day 3', label: 'Day 3' },
                    ];

                    const filledCriteria = criteria.map(c => {
                        if (c.id === 'team_participation') return hasTeamEvent;
                        if (c.id.startsWith('Day')) {
                            const d = parseInt(c.id.split(' ')[1]);
                            return days.has(d);
                        }
                        return categories.has(c.id);
                    });

                    const isComplete = filledCriteria.every(Boolean);

                    if (isComplete) {
                        const hasSeen = localStorage.getItem('etamax_criteria_seen');

                        // Suppress on Profile AND Payment pages to avoid annoyance
                        const isExcludedPage = pathname.includes('/profile') || pathname.includes('/payment');

                        if (!hasSeen && !isExcludedPage) {
                            setShowPaymentModal(true);
                            localStorage.setItem('etamax_criteria_seen', 'true');
                        }
                    } else {
                        // Reset if criteria lost
                        localStorage.removeItem('etamax_criteria_seen');
                    }
                }
            } catch (err) {
                console.error("Error checking criteria:", err);
            }
        }


        // Only run check if we are NOT on excluded pages (optimization)
        // But we need to run it to potential RESET the localstorage if they cancelled.
        // So we run it everywhere, but only SHOW if not excluded.
        checkCriteria();
    }, [pathname]);

    if (!showPaymentModal) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#15151a] border border-green-500/30 p-8 rounded-3xl max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">

                {/* Success Animation Background */}
                <div className="absolute inset-0 bg-green-500/5" />

                <div className="relative text-center z-10">
                    {/* Animated Checkmark */}
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <CheckCircle2 size={40} className="text-white animate-in zoom-in duration-500" strokeWidth={3} />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Criteria Fulfilled!</h3>

                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-sm text-green-200/90 leading-relaxed">
                        <p className="font-semibold mb-1">🎉 You have met all requirements!</p>
                        <p className="opacity-80">You can now proceed to payment.</p>
                    </div>

                    <p className="text-gray-400 text-xs mb-6">
                        Please visit your profile to complete the process.
                    </p>

                    <div className="flex flex-col gap-3">
                        {/* Primary Action: Profile */}
                        <button
                            onClick={() => window.location.href = '/profile'}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold transition-all shadow-lg shadow-green-500/25 active:scale-95 flex items-center justify-center gap-2 group"
                        >
                            <span>Go to My Profile</span>
                            <Users size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="w-full py-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

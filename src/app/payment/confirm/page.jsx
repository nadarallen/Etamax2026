'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserRegistrationsAction, getUserProfileAction } from '@/server-actions/user';
import { cancelRegistrationAction } from '@/server-actions/registration';
import { CheckCircle2, AlertCircle, X, Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import useRazorpay from '@/hooks/useRazorpay';
import Script from 'next/script';
import Link from 'next/link';
import CriteriaProgress from '@/components/CriteriaProgress';

function PaymentConfirmContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Get bypass code from URL
    const bypassCode = searchParams.get('bypass');

    const [pendingRegs, setPendingRegs] = useState([]);
    const [allRegs, setAllRegs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const { processPayment, isProcessing } = useRazorpay();
    const [calculating, setCalculating] = useState(false);
    const [showOfflineModal, setShowOfflineModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [regData, profile] = await Promise.all([
                getUserRegistrationsAction(),
                getUserProfileAction()
            ]);

            if (profile) setUser(profile);

            if (regData.registrations) {
                setAllRegs(regData.registrations);

                // Filter only PENDING registrations pending payment OR Free events
                const pending = regData.registrations.filter(r =>
                    r.status !== 'CANCELLED' &&
                    (
                        r.status === 'PENDING' ||
                        r.paymentMethod === 'OFFLINE' ||
                        (r.status === 'CONFIRMED' && (!r.event?.price || r.event?.price === 0))
                    )
                );
                setPendingRegs(pending);
            }
        } catch (error) {
            console.error("Failed to load confirm data", error);
        } finally {
            setLoading(false);
        }
    }

    const handleRemove = async (regId) => {
        if (!confirm("Are you sure you want to remove this event? Your seat will be freed.")) return;

        setCalculating(true);
        try {
            const res = await cancelRegistrationAction(regId);
            if (res.success) {
                setPendingRegs(prev => prev.filter(p => p._id !== regId));
                setAllRegs(prev => prev.filter(p => p._id !== regId));
            } else {
                alert(res.error || "Failed to remove event");
            }
        } catch (error) {
            console.error(error);
            alert("Error removing event");
        } finally {
            setCalculating(false);
        }
    };

    // Calculate Eligibility
    const activeRegs = allRegs.filter(r => r.status && r.status !== 'CANCELLED');
    const categories = new Set(activeRegs.map(r => r.event?.category?.toLowerCase()).filter(Boolean));
    const days = new Set(activeRegs.map(r => r.slot?.dayNumber).filter(Boolean));

    // Check for team participation (required for eligibility)
    const hasTeamEvent = activeRegs.some(r =>
        r.event?.type === 'group' &&
        r.team &&
        r.team.memberCount >= 1
    );

    // Validate bypass code against environment variable
    const VALID_BYPASS_CODE = process.env.NEXT_PUBLIC_PAYMENT_BYPASS_CODE || 'BYPASS2026';
    const isBypassValid = bypassCode && bypassCode.trim() === VALID_BYPASS_CODE;

    const isEligible =
        (categories.has('technical') &&
            categories.has('cultural') &&
            categories.has('seminar') &&
            days.has(1) &&
            days.has(2) &&
            days.has(3) &&
            hasTeamEvent) || isBypassValid; // Team participation is now required

    // Helper function to calculate price for a registration
    // Team leaders pay full price, team members pay 0
    const getRegistrationPrice = (reg) => {
        if (!reg.event?.price) return 0;

        // If it's a team event, only the leader pays
        if (reg.team && reg.team.leaderId) {
            const isLeader = reg.team.leaderId.toString() === user?._id?.toString();
            return isLeader ? reg.event.price : 0;
        }

        // Solo events - user pays full price
        return reg.event.price;
    };

    const totalAmount = pendingRegs.reduce((sum, r) => sum + getRegistrationPrice(r), 0);

    const handlePayment = async () => {
        if (pendingRegs.length === 0) return;

        try {
            const regIds = pendingRegs.map(r => r._id);
            await processPayment({
                registrationIds: regIds, // Special Bulk Mode
                bypassCode, // Pass code to hook
                eventDetails: { name: `Bulk Payment (${pendingRegs.length} events)` }, // Dummy for display
                userDetails: user,
                amount: totalAmount, // Will be verified on server
                onSuccess: (response) => {
                    // Redirect to profile or a success summary
                    router.push('/profile?payment=success');
                },
                onError: (err) => {
                    alert(err.message || "Payment Failed");
                }
            });
        } catch (error) {
            console.error("Payment Error", error);
        }
    };

    if (loading) return <div className="min-h-screen pt-24 text-center text-white">Loading checkout...</div>;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <Link href="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                <ArrowLeft size={18} className="mr-2" /> Back to Profile
            </Link>

            <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Review & Pay</h1>
                        <p className="text-gray-400">Confirm your events before proceeding to payment.</p>
                    </div>
                </div>

                {/* Criteria / Eligibility Widget */}
                <div className="mb-8">
                    <CriteriaProgress registrations={allRegs} />
                </div>

                {pendingRegs.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                        <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Pending Payments</h3>
                        <p className="text-gray-400 mb-6">Great! You are all settled.</p>
                        <Link href="/profile">
                            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium">
                                Go to Profile
                            </button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* List */}
                        <div className="space-y-4 mb-8">
                            {pendingRegs.map((reg) => (
                                <div key={reg._id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-galaxy-purple/20 flex items-center justify-center text-galaxy-purple font-bold">
                                            {reg.slot?.dayNumber ? `D${reg.slot.dayNumber}` : '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{reg.event?.name}</h4>
                                            <div className="flex gap-3 text-xs text-gray-400 uppercase tracking-wider">
                                                <span>{reg.event?.category}</span>
                                                <span className="text-gray-600">•</span>
                                                <span>{reg.slot?.venue || 'Venue TBD'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white">
                                                {(reg.event?.price > 0) ? `₹${reg.event.price}` : <span className="text-green-400">FREE</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Footer */}
                        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
                            <div className="flex flex-col items-end md:items-start gap-1">
                                <span className="text-gray-400 text-sm uppercase tracking-wider">Total Amount</span>
                                <span className="text-4xl font-bold text-white">₹{totalAmount}</span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                {/* Online Payment Button */}
                                {isEligible ? (
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing || calculating}
                                        className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:grayscale"
                                    >
                                        {isProcessing ? 'Processing...' : (
                                            <>
                                                <CreditCard size={20} /> Pay Online Now
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button disabled className="w-full md:w-auto bg-gray-700/50 text-gray-400 font-bold py-4 px-8 rounded-xl border border-white/5 cursor-not-allowed flex items-center justify-center gap-2">
                                        <span>Pay Online Locked</span>
                                        <span className="text-xs bg-black/40 px-2 py-1 rounded">Criteria Incomplete</span>
                                    </button>
                                )}

                                {/* Offline / Reserve Button */}
                                <button
                                    onClick={() => setShowOfflineModal(true)}
                                    className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl border border-white/20 transition-all active:scale-95"
                                >
                                    Pay Offline / Reserve Seat
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-6 text-center w-full">
                            Encrypted Secure Payment via Razorpay
                        </p>
                    </>
                )}
            </div>

            {/* Offline Modal */}
            {showOfflineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0f0f13] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <button onClick={() => setShowOfflineModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-bold text-white mb-4">Offline Payment Instructions</h3>
                        <div className="space-y-4 text-gray-300">
                            <p>To confirm your seat via Cash Payment:</p>
                            <ol className="list-decimal list-inside space-y-2 ml-2">
                                <li>Visit the <strong>Registration Desk</strong> at the venue.</li>
                                <li>Show your <strong>Profile Page</strong> or <strong>QR Code</strong>.</li>
                                <li>Pay the total amount (₹{totalAmount}) in cash.</li>
                                <li>The desk volunteer will mark your status as <strong>PAID</strong>.</li>
                            </ol>
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-yellow-400 text-sm mt-4">
                                Note: Your seats are currently <strong>Reserved</strong>. Payment is required to confirm participation.
                            </div>
                        </div>
                        <button onClick={() => setShowOfflineModal(false)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PaymentConfirmPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-24 text-center text-white">Loading payment confirmation...</div>}>
            <PaymentConfirmContent />
        </Suspense>
    );
}

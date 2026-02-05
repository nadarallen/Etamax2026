'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfileAction, getUserRegistrationsAction } from '@/server-actions/user';
import { cancelRegistrationAction } from '@/server-actions/registration';
import Link from 'next/link';
import { Calendar, MapPin, ExternalLink, User, ArrowLeft, Trash2 } from 'lucide-react';
import CriteriaProgress from '@/components/CriteriaProgress';
import TeamManager from '@/components/TeamManager';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [bypassCode, setBypassCode] = useState('');
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    const activeRegs = registrations.filter(r => r.status && r.status !== 'CANCELLED');

    const handleCancel = async (regId) => {
        if (!confirm("Are you sure you want to cancel this registration? This action cannot be undone.")) return;
        setProcessing(true);
        try {
            const res = await cancelRegistrationAction(regId);
            if (res.success) {
                // Remove from local state
                setRegistrations(prev => prev.filter(r => r._id !== regId));
                alert("Registration cancelled successfully.");
            } else {
                alert(res.error || "Failed to cancel registration.");
            }
        } catch (error) {
            console.error("Cancel error:", error);
            alert("An error occurred.");
        } finally {
            setProcessing(false);
        }
    };

    // Calculate Eligibility
    const categories = new Set(activeRegs.map(r => r.event?.category?.toLowerCase()).filter(Boolean));
    const days = new Set(activeRegs.map(r => r.slot?.dayNumber).filter(Boolean));

    // Check for team participation (for criteria tracking)
    const hasTeamEvent = activeRegs.some(r =>
        r.event?.type === 'group' &&
        r.team &&
        r.team.memberCount >= 1
    );

    // Check if user has any group events registered (regardless of team status)
    const hasGroupEventRegistration = activeRegs.some(r => r.event?.type === 'group');

    // Eligibility: Must have technical, cultural, seminar, and all 3 days
    // Team requirement: Only if user has registered for a group event, they must be in a team
    const isEligible =
        categories.has('technical') &&
        categories.has('cultural') &&
        categories.has('seminar') &&
        days.has(1) &&
        days.has(2) &&
        days.has(3) &&
        (!hasGroupEventRegistration || hasTeamEvent); // If has group event, must have team

    // Validate bypass code against environment variable
    const VALID_BYPASS_CODE = process.env.NEXT_PUBLIC_PAYMENT_BYPASS_CODE || 'BYPASS2026';
    const isBypassValid = bypassCode && bypassCode.trim() === VALID_BYPASS_CODE;

    // Check if there are actually pending payments
    const hasPendingPayments = activeRegs.some(r => r.status === 'PENDING' || r.paymentStatus === 'PENDING');

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

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch User Profile
                const profile = await getUserProfileAction();
                if (!profile) {
                    router.push('/login'); // Redirect if not logged in
                    return;
                }
                setUser(profile);

                // Fetch Registrations
                const regsData = await getUserRegistrationsAction();
                if (regsData.registrations) {
                    setRegistrations(regsData.registrations);
                }
            } catch (error) {
                console.error("Failed to load profile data", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [router]);

    if (loading) {
        return <div className="min-h-screen pt-24 text-center text-white">Loading profile...</div>;
    }

    // Safety check: If not loading but user is missing (e.g. during redirect), return null/nothing
    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto">
            <Link href="/events" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back to Events
            </Link>

            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <User className="w-8 h-8" /> My Profile
            </h1>

            {/* User Info Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-10 border border-white/10">
                <div className="grid md:grid-cols-2 gap-4 text-white">
                    <div>
                        <p className="text-gray-400 text-sm">Full Name</p>
                        <p className="text-xl font-medium">{user.fullName}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-xl font-medium">{user.email}</p>
                    </div>
                    {user.rollNumber && (
                        <div>
                            <p className="text-gray-400 text-sm">Roll Number</p>
                            <p className="text-lg">{user.rollNumber}</p>
                        </div>
                    )}
                    {(user.branch || user.semester) && (
                        <div>
                            <p className="text-gray-400 text-sm">Academic Details</p>
                            <p className="text-lg">{user.branch} {user.semester ? `- Sem ${user.semester}` : ''}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Criteria Progress Widget */}
            <CriteriaProgress registrations={registrations} />

            {/* Team Manager (For Leaders) */}
            <TeamManager />

            {/* Payment / Checkout Section */}
            {hasPendingPayments && (
                <div className="mb-10 p-6 bg-gradient-to-r from-galaxy-purple/10 to-blue-600/10 rounded-2xl border border-galaxy-purple/20 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Complete Registration</h2>
                            {(isEligible || isBypassValid) ? (
                                <div>
                                    <p className="text-gray-300 mb-2">
                                        You have fulfilled all participation criteria!
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="bg-black/30 px-3 py-1 rounded-lg border border-white/10 text-gray-300">
                                            Pending: <span className="text-white font-bold">{activeRegs.filter(r => r.status === 'PENDING' || r.paymentStatus !== 'PAID').length} Events</span>
                                        </div>
                                        <div className="bg-galaxy-purple/20 px-3 py-1 rounded-lg border border-galaxy-purple/30 text-galaxy-accent">
                                            Total: <span className="text-white font-bold text-lg">
                                                {(() => {
                                                    const amt = activeRegs
                                                        .filter(r => r.status === 'PENDING' || r.paymentStatus !== 'PAID')
                                                        .reduce((sum, r) => sum + getRegistrationPrice(r), 0);
                                                    return amt === 0 ? 'FREE' : `₹${amt}`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-yellow-400 flex items-center gap-2">
                                    <span className="bg-yellow-500/20 p-1 rounded-full text-xs">⚠</span>
                                    Payment Locked: Complete remaining criteria to unlock online payment.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                {(isEligible || isBypassValid) ? (
                                    <>
                                        <Link
                                            href={isBypassValid ? `/payment/confirm?bypass=${encodeURIComponent(bypassCode)}` : "/payment/confirm"}
                                            className="w-full md:w-auto"
                                        >
                                            <button className="w-full cursor-pointer bg-galaxy-purple hover:bg-galaxy-purple/90 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all active:scale-95 flex flex-col items-center leading-none py-2 gap-1">
                                                <span>Pay Online Now</span>
                                                {(() => {
                                                    const amt = activeRegs
                                                        .filter(r => r.status === 'PENDING' || r.paymentStatus !== 'PAID')
                                                        .reduce((sum, r) => sum + getRegistrationPrice(r), 0);
                                                    if (amt > 0) return <span className="text-[10px] opacity-80 font-normal">Amount: ₹{amt}</span>;
                                                })()}
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => setShowOfflineModal(true)}
                                            className="w-full md:w-auto cursor-pointer bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl border border-white/10 transition-all active:scale-95"
                                        >
                                            Pay Offline
                                        </button>
                                    </>
                                ) : (
                                    <button disabled className="w-full md:w-auto opacity-50 cursor-not-allowed bg-gray-600 text-gray-300 font-bold py-3 px-8 rounded-xl border border-white/5">
                                        Payment Locked
                                    </button>
                                )}
                            </div>

                            {/* Access Code Section */}
                            <div className="w-full">
                                <button
                                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                                    className="text-sm text-blue-400 hover:text-blue-300 w-full text-right transition-colors flex items-center justify-end gap-1 underline decoration-blue-400/30 underline-offset-4"
                                >
                                    Have an Access Code?
                                </button>
                                {isAdminOpen && (
                                    <div className="mt-2 bg-white/5 p-3 rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-1">
                                        <input
                                            type="text"
                                            value={bypassCode}
                                            onChange={(e) => setBypassCode(e.target.value)}
                                            placeholder="Enter Access Code"
                                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-galaxy-purple outline-none"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Enter your special code to unlock payment options.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Offline Modal */}
            {showOfflineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0f0f13] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <button onClick={() => setShowOfflineModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-bold text-white mb-4">Offline Payment Instructions</h3>
                        <div className="space-y-4 text-gray-300">
                            <p>To pay offline (Cash):</p>
                            <ol className="list-decimal list-inside space-y-2 ml-2">
                                <li>Go to the <strong>Registration Desk</strong> at the venue.</li>
                                <li>Show your <strong>Profile Page</strong> or <strong>QR Code</strong>.</li>
                                <li>Pay the total amount in cash.</li>
                                <li>The desk volunteer will mark your status as <strong>PAID</strong>.</li>
                            </ol>
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-yellow-400 text-sm mt-4">
                                Note: Your seats are <strong>Reserved</strong> but not confirmed until payment.
                            </div>
                        </div>
                        <button onClick={() => setShowOfflineModal(false)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold">Close</button>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white">My Registrations</h2>
                {activeRegs.length > 0 && (
                    <Link
                        href={`/receipt/${activeRegs[0]._id}`}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        <ExternalLink className="w-5 h-5" /> Download Master Receipt
                    </Link>
                )}
            </div>

            {
                activeRegs.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-gray-400 text-lg mb-4">You haven't registered for any active events yet.</p>
                        <Link href="/events" className="inline-block bg-galaxy-purple px-6 py-2 rounded-lg text-white font-medium hover:bg-galaxy-purple/80 transition shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeRegs.map((reg) => (
                            <div key={reg._id} className="bg-black/40 border border-white/10 rounded-xl p-5 hover:border-galaxy-purple/50 transition-colors relative group flex flex-col h-full bg-gradient-to-br from-white/5 to-transparent">
                                <div className="flex flex-col gap-4 flex-1">

                                    {/* Header: Name + Badge */}
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="text-xl font-bold text-white group-hover:text-galaxy-purple transition-colors leading-tight">
                                            {reg.event?.name || 'Unknown Event'}
                                        </h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${reg.status === 'CONFIRMED' || reg.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {reg.status}
                                                </span>
                                                {/* Cancel Button - Only for Pending (Before Payment) or Free Events */}
                                                {/* Cancel Button - Hide if Paid/Confirmed (unless it's a free event) */}
                                                {(() => {
                                                    const isPaidStatus = reg.status === 'CONFIRMED' || reg.status === 'PAID';
                                                    const isFree = reg.event?.price === 0 || reg.paymentMethod === 'FREE';
                                                    // Show if: (Not Paid/Confirmed) OR (Is Free)
                                                    // This means: Hide if (Paid/Confirmed AND Not Free)
                                                    if (isPaidStatus && !isFree) return null;

                                                    return (
                                                        <button
                                                            onClick={() => handleCancel(reg._id)}
                                                            disabled={processing}
                                                            className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                                                            title="Cancel Registration"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                            {reg.paymentMethod && (
                                                <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                                                    {reg.paymentMethod}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 text-sm text-gray-300">
                                        {reg.slot?.venue && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                <span>{reg.slot.venue}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span>
                                                {reg.slot ? `Day ${reg.slot.dayNumber} • ${reg.slot.startTime}` : 'Slot details unavailable'}
                                            </span>
                                        </div>
                                        {reg.team && (
                                            <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/5">
                                                <p className="text-xs text-gray-400 mb-0.5">Team Details</p>
                                                <p className="font-semibold text-white text-xs">{reg.team.name} <span className="text-gray-500">({reg.team.code})</span></p>
                                                {reg.team.leaderId === user._id && <span className="text-[10px] text-galaxy-purple font-bold">LEADER</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
}

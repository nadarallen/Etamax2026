'use client';

import { useState, useEffect } from 'react';
import RazorpayButton from './RazorpayButton';
import { getUserManagedTeamsAction, removeTeamMemberAction } from '@/server-actions/team';
import { Users, Trash2, Copy, Check, Crown, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TeamManager() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        loadTeams();
    }, []);

    async function loadTeams() {
        try {
            const res = await getUserManagedTeamsAction();
            if (res.success) {
                setTeams(res.teams);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const handlePaymentSuccess = async (paymentData, teamId) => {
        alert('Payment Successful! Team Confirmed.');
        loadTeams(); // Refresh to update status
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedId(code);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const removeMember = async (teamId, memberId) => {
        if (!confirm('Are you sure you want to remove this member? This will DELETE their registration.')) return;

        const res = await removeTeamMemberAction(teamId, memberId);
        if (res.success) {
            loadTeams(); // Refresh
        } else {
            alert(res.error || 'Failed to remove member'); // Show specific error (e.g. Payment Confirmed)
        }
    };

    // Helper to check if team is full
    const isTeamFull = (team) => {
        const max = team.eventId?.maxMembers || 0;
        return team.members.length >= max;
    };

    if (loading) return null;
    if (teams.length === 0) return null;

    return (
        <div className="space-y-6 mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                    <Crown className="text-yellow-400" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white font-display">My Teams</h2>
                    <p className="text-gray-400 text-sm">Manage your squads and team members</p>
                </div>
            </div>

            <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
                {teams.map(team => {
                    const isPaymentPending = team.status === 'LOCKED' || team.members.some(m => m.paymentStatus === 'PENDING');
                    const isConfirmed = team.status === 'CONFIRMED';
                    const teamFull = isTeamFull(team);
                    const maxMembers = team.eventId?.maxMembers || '?';
                    const isLeader = team.leaderId === team.members.find(m => m.userId === team.leaderId)?.userId; // Session check ideally, but we can assume viewer is leader if in this list (since getUserManagedTeamsAction only returns led teams? Wait, logic says 'managed' so yes. But checking session user ID in frontend requires passed prop or context. Actually getUserManagedTeamsAction filters by leaderId: session.id, so viewer IS leader. )

                    return (
                        <div key={team._id} className="group relative bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-white/10 hover:shadow-2xl hover:shadow-purple-500/5">
                            {/* Header Background */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                            <div className="relative p-6 sm:p-8">
                                {/* Team Header */}
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-white tracking-tight">{team.name}</h3>
                                            {isPaymentPending ? (
                                                <div className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 flrx items-center animate-pulse">
                                                    <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                                                        <AlertTriangle size={10} /> Action Required
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center">
                                                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 uppercase tracking-wider">
                                                        <ShieldCheck size={10} /> Verified
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-purple-400 flex items-center gap-2">
                                            <Sparkles size={14} />
                                            {team.eventId?.name || 'Unknown Event'}
                                        </p>
                                    </div>

                                    {/* Team Code Badge */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Team Access Code</span>
                                        <button
                                            onClick={() => copyCode(team.code)}
                                            className="group/code flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 px-4 py-2 rounded-xl transition-all duration-300"
                                        >
                                            <code className="font-mono text-xl font-bold text-white tracking-widest">{team.code}</code>
                                            {copiedId === team.code ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-500 group-hover/code:text-purple-400 transition-colors" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Members List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
                                        <span>Squad Members</span>
                                        <span>{team.members.length} / {maxMembers}</span>
                                    </div>

                                    <div className="grid gap-3">
                                        {team.members.map((member) => {
                                            const isLeader = member.userId === team.leaderId;
                                            const isPaid = member.paymentStatus === 'PAID';

                                            return (
                                                <div key={member.userId} className={`relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${isLeader ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${isLeader
                                                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black'
                                                            : 'bg-gradient-to-br from-gray-700 to-gray-900 text-gray-300 border border-white/10'
                                                            }`}>
                                                            {isLeader ? <Crown size={16} fill="currentColor" /> : member.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold text-sm ${isLeader ? 'text-yellow-100' : 'text-white'}`}>
                                                                    {member.fullName}
                                                                </span>
                                                                {isLeader && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 rounded font-bold">LEADER</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-mono">{member.rollNumber}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        {/* Status Indicator */}
                                                        <div className={`flex flex-col items-end`}>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${isPaid
                                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                }`}>
                                                                {isPaid ? 'CONFIRMED' : 'PENDING'}
                                                            </span>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        {!isLeader && (
                                                            <button
                                                                onClick={() => removeMember(team._id, member.userId)}
                                                                className={`p-2 rounded-lg transition-colors ${isConfirmed
                                                                    ? 'text-gray-600 cursor-not-allowed opacity-50'
                                                                    : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                                                                    }`}
                                                                disabled={isConfirmed}
                                                                title={isConfirmed ? "Cannot remove after payment" : "Remove Member"}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Payment Section - Only for Leader & if Pending */}
                                {isPaymentPending && (
                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-400 text-sm">Amount to Pay</span>
                                                <span className="text-xl font-bold text-white">₹{team.eventId?.price || 0}</span>
                                            </div>

                                            {!teamFull ? (
                                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3 text-yellow-200 text-sm">
                                                    <AlertTriangle size={18} />
                                                    <span>Fill all <b>{maxMembers}</b> slots to enable payment.</span>
                                                </div>
                                            ) : (
                                                <div className="w-full space-y-3">
                                                    <RazorpayButton
                                                        amount={team.eventId?.price || 0}
                                                        userDetails={{
                                                            name: team.members[0].fullName, // Leader
                                                            email: team.members[0].email,
                                                            phone: '0000000000'
                                                        }}
                                                        eventDetails={{
                                                            id: team.eventId?._id || team.eventId?.id,
                                                            name: team.eventId?.name,
                                                            type: team.eventId?.type,
                                                            slotId: team.slotId
                                                        }}
                                                        onSuccess={(data) => handlePaymentSuccess(data, team._id)}
                                                    />
                                                    <button
                                                        onClick={() => alert(`Offline Payment Instructions:\n\n1. Visit the Registration Desk.\n2. Show your Team ID: ${team.code}\n3. Pay ₹${team.eventId?.price} in cash/UPI.\n4. Admin will confirm your payment.`)}
                                                        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg border border-white/10 transition-colors"
                                                    >
                                                        Pay Offline / At Desk
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

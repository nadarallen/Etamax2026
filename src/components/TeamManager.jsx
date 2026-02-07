'use client';

import { useState, useEffect } from 'react';
import RazorpayButton from './RazorpayButton';
import { getUserManagedTeamsAction, removeTeamMemberAction, deleteTeamAction } from '@/server-actions/team';
import { Users, Trash2, Copy, Check, Crown, AlertTriangle, Sparkles, ShieldCheck, Wallet, CreditCard, Calendar, Clock, MapPin } from 'lucide-react';
import PlanetIcon from './PlanetIcon';
import { useRouter } from 'next/navigation';

export default function TeamManager({ eventId }) { // Accept eventId prop
    const router = useRouter();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        loadTeams();
    }, [eventId]); // Re-run when eventId changes

    async function loadTeams() {
        try {
            const res = await getUserManagedTeamsAction();
            if (res.success) {
                // Filter by eventId if provided
                const allTeams = res.teams;
                const filtered = eventId
                    ? allTeams.filter(t => t.eventId?._id === eventId || t.eventId === eventId)
                    : allTeams;
                setTeams(filtered);
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

    const handleDeleteTeam = async (teamId) => {
        if (!confirm('Are you sure you want to DELETE this team? This explicitly dissolves the team and cancels all members. This cannot be undone.')) return;

        setLoading(true); // Re-use loading state or add specific one
        const res = await deleteTeamAction(teamId);
        if (res.success) {
            alert('Team deleted successfully.');
            loadTeams();
        } else {
            alert(res.error || 'Failed to delete team');
            setLoading(false);
        }
    };

    // Helper to check if team is valid for payment
    const isTeamValid = (team) => {
        const min = team.eventId?.minTeamSize || 2;
        // Default max to 4 if missing, or use maxMembers if defined
        const max = team.eventId?.maxTeamSize || team.eventId?.maxMembers || 4;
        return team.members.length >= min && team.members.length <= max;
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
                    const teamValid = isTeamValid(team);
                    const maxMembers = team.eventId?.maxMembers || '?';
                    const isLeaderViewing = team.isLeader; // Current user is leader
                    const isMemberLeader = (memberId) => memberId === team.leaderId;

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
                                            {team.status === 'CONFIRMED' ? (
                                                <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center">
                                                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 uppercase tracking-wider">
                                                        <ShieldCheck size={10} /> Verified
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 flrx items-center animate-pulse">
                                                    <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                                                        <AlertTriangle size={10} />
                                                        {team.status === 'CANCELLED'
                                                            ? 'Cancelled'
                                                            : (team.members.length < (team.eventId?.minTeamSize || 2) ? 'Minimum 2 Members' : 'Pending Payment')
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {/* Delete Team Button for Leader (Only if not confirmed) */}
                                            {isLeaderViewing && !isConfirmed && (
                                                <button
                                                    onClick={() => handleDeleteTeam(team._id)}
                                                    className="p-1.5 ml-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-red-500/20 transition-all"
                                                    title="Dissolve Team"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-purple-400 flex items-center gap-2">
                                            <Sparkles size={14} />
                                            {team.eventId?.name || 'Unknown Event'}
                                        </p>
                                    </div>

                                </div>

                                {/* Schedule Box */}
                                {team.slotId && (
                                    <div className="mt-4 mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden group/schedule">
                                        {/* Galaxy Glow Effect */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity opacity-50 group-hover/schedule:opacity-75" />

                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-white/10 shadow-lg shadow-purple-500/5">
                                                <PlanetIcon day={team.slotId?.dayNumber || 1} className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase tracking-widest text-purple-300 font-bold flex items-center gap-1.5 mb-0.5">
                                                    <Calendar size={10} />
                                                    Day {team.slotId?.dayNumber || '?'}
                                                </div>
                                                <div className="text-white font-bold text-lg flex items-center gap-2">
                                                    {team.slotId?.startTime || 'TBA'} - {team.slotId?.endTime || 'TBA'}
                                                </div>
                                                {team.slotId?.venue && (
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={10} /> {team.slotId.venue}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end relative z-10">
                                            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                                <Clock size={12} />
                                                <span>Scheduled</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                        const isMemberLeader = member.userId === team.leaderId;
                                        const isPaid = member.paymentStatus === 'PAID';

                                        const avatarStyles = isMemberLeader
                                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black'
                                            : 'bg-gradient-to-br from-gray-700 to-gray-900 text-gray-300 border border-white/10';

                                        return (
                                            <div key={member.userId} className={`relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${isMemberLeader ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${avatarStyles}`}>
                                                        {isMemberLeader ? <Crown size={16} fill="currentColor" /> : member.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold text-sm ${isMemberLeader ? 'text-yellow-100' : 'text-white'}`}>
                                                                {member.fullName}
                                                            </span>
                                                            {isMemberLeader && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 rounded font-bold">LEADER</span>}
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
                                                            {team.status === 'CONFIRMED' ? 'CONFIRMED' : (isPaid ? 'PAID' : 'PENDING')}
                                                        </span>
                                                    </div>

                                                    {/* Action Buttons - Only Leader can remove members (and not themselves) */}
                                                    {isLeaderViewing && !isMemberLeader && (
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



                        </div>
                    );
                })}
            </div>
        </div>
    );
}

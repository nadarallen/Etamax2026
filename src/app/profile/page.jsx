'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfileAction, getUserRegistrationsAction } from '@/server-actions/user';
import Link from 'next/link';
import { Calendar, MapPin, ExternalLink, User, ArrowLeft } from 'lucide-react';
import CriteriaProgress from '@/components/CriteriaProgress';
import TeamManager from '@/components/TeamManager';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

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

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white">My Registrations</h2>
                {registrations.length > 0 && (
                    <Link
                        href={`/receipt/${registrations[0]._id}`}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        <ExternalLink className="w-5 h-5" /> Download Master Receipt
                    </Link>
                )}
            </div>

            {registrations.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-gray-400 text-lg mb-4">You haven't registered for any events yet.</p>
                    <Link href="/events" className="inline-block bg-galaxy-purple px-6 py-2 rounded-lg text-white font-medium hover:bg-galaxy-purple/80 transition shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {registrations.map((reg) => (
                        <div key={reg._id} className="bg-black/40 border border-white/10 rounded-xl p-5 hover:border-galaxy-purple/50 transition-colors relative group flex flex-col h-full bg-gradient-to-br from-white/5 to-transparent">
                            <div className="flex flex-col gap-4 flex-1">

                                {/* Header: Name + Badge */}
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="text-xl font-bold text-white group-hover:text-galaxy-purple transition-colors leading-tight">
                                        {reg.event?.name || 'Unknown Event'}
                                    </h3>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${reg.status === 'CONFIRMED' || reg.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {reg.status}
                                        </span>
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
            )}
        </div>
    );
}

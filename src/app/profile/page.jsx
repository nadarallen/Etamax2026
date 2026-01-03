'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfileAction, getUserRegistrationsAction } from '@/server-actions/user';
import Link from 'next/link';
import { Calendar, MapPin, ExternalLink, User } from 'lucide-react';
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

            <h2 className="text-2xl font-bold text-white mb-6">My Registrations</h2>

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
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${reg.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {reg.status}
                                    </span>
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
                                </div>

                                {/* Action Button - Full Width on Mobile */}
                                <div className="pt-2">
                                    <Link
                                        href={`/receipt/${reg._id}`}
                                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-colors font-semibold text-sm w-full active:scale-95 duration-200"
                                    >
                                        View Receipt <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

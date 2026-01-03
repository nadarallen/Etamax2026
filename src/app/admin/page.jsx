'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import eventsData from '@/data/events.json';
import { Settings, Lock, Unlock, Edit, LogOut, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { deleteEventAction } from '@/server-actions/events';

function AdminContent() {
    const router = useRouter();
    const searchParamsHook = useSearchParams();
    const key = searchParamsHook.get('key');
    const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalRevenue: 0 });
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsRes, eventsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/events')
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats);
            }
            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                setEvents(eventsData.events);
            }
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="min-h-screen pt-24 text-white text-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">

            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-widest flex items-center gap-3">
                        <Settings className="text-galaxy-purple" />
                        ADMIN DASHBOARD
                    </h1>
                    <p className="text-gray-400 mt-2">Manage ETAMAX 2026 Events</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Total Revenue</p>
                        <p className="text-xl font-bold text-green-400">₹{stats.totalRevenue}</p>
                    </div>
                    <div>
                        <button
                            onClick={async () => {
                                await import('@/server-actions/auth').then(mod => mod.logoutAction());
                            }}
                            className="flex items-center gap-2 px-6 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors h-full"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Active Events</p>
                    <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Registrations</p>
                    <p className="text-2xl font-bold text-white">{stats.totalRegistrations}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">All Events</h2>
                <Link href="/admin/students">
                    <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <Users size={16} /> Students Report
                    </button>
                </Link>
                <Link href="/admin/create-event">
                    <button
                        className="bg-galaxy-purple/20 hover:bg-galaxy-purple/30 text-galaxy-purple border border-galaxy-purple/50 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                        + Create Event
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-galaxy-purple/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold text-galaxy-accent uppercase tracking-wider">{event.type}</span>
                                <h3 className="text-xl font-bold text-white mt-1 group-hover:text-galaxy-purple transition-colors">{event.name}</h3>
                            </div>
                            <span className="text-lg font-bold text-white/50">₹{event.price}</span>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center text-sm text-gray-400">
                                <span className={event.isPublished ? "text-green-400" : "text-yellow-400"}>
                                    {event.isPublished ? 'Published' : 'Draft'}
                                </span>
                                <span className="bg-white/10 px-2 py-1 rounded text-xs text-white">
                                    {event.type === 'solo'
                                        ? `${event.stats?.totalRegistered || 0} / ${event.stats?.totalCapacity || 0} Reg`
                                        : `${event.stats?.totalTeams || 0} / ${event.stats?.totalCapacity || 0} Teams`
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/admin/edit-event/${event._id}`} className="flex-1">
                                <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors border border-white/5">
                                    <Edit size={14} /> Edit
                                </button>
                            </Link>
                            <Link href={`/admin/events/${event._id}/slots`} className="flex-1">
                                <button className="w-full flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium transition-colors border border-green-500/20">
                                    <Unlock size={14} /> Slots
                                </button>
                            </Link>
                            <Link href={`/admin/events/${event._id}/registrations`} className="flex-1">
                                <button className="w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-500/20">
                                    <Users size={14} /> Users
                                </button>
                            </Link>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this event?')) {
                                        await deleteEventAction(event._id);
                                        // Ideally we should use optimistic updates or router refresh, but for now revalidatePath helps
                                        fetchData();
                                    }
                                }}
                                className="flex-0 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center justify-center border border-red-500/20"
                                title="Delete Event"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {events.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No events found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading Admin...</div>}>
            <AdminContent />
        </Suspense>
    );
}

'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import eventsData from '@/data/events.json';
import { Settings, Lock, Unlock, Edit, LogOut, Trash2, Users, Search } from 'lucide-react';
import Link from 'next/link';
import { deleteEventAction } from '@/server-actions/events';
import { logoutAction } from '@/server-actions/auth';

function AdminContent() {
    const router = useRouter();
    const searchParamsHook = useSearchParams();
    const key = searchParamsHook.get('key');
    const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalRevenue: 0 });
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDesk, setShowDesk] = useState(false); // Rapid Payment State
    const [searchTerm, setSearchTerm] = useState('');

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

    // Filter Logic
    const filteredEvents = events.filter(event =>
        event.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">

            {/* ... Header and Stats ... */}

            {/* Revenue Components */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Revenue Breakdown</h3>
                    {stats.clubStats && stats.clubStats.length > 0 ? (
                        <div className="space-y-3">
                            {stats.clubStats.map((club, idx) => (
                                <div key={idx} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0">
                                    <span className="text-gray-300 font-medium">{club.club}</span>
                                    <span className="text-green-400 font-mono font-bold">₹{club.revenue.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/20">
                                <span className="text-white font-bold">Total</span>
                                <span className="text-green-400 font-mono font-bold text-lg">₹{stats.totalRevenue?.toLocaleString()}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No revenue data available.</p>
                    )}
                </div>
                {/* Quick Actions / Other Stats placeholders could go here */}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
                <div className="w-full md:w-auto">
                    <h2 className="text-xl font-bold text-white mb-4 md:mb-0">All Events</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:border-galaxy-purple outline-none transition-colors"
                        />
                    </div>

                    <button
                        onClick={() => setShowDesk(true)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                        💳 Offline Desk
                    </button>
                    <Link href="/admin/students">
                        <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                            <Users size={16} /> Students Report
                        </button>
                    </Link>
                    <Link href="/admin/create-event">
                        <button
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                        >
                            + Create Event
                        </button>
                    </Link>
                    <button
                        onClick={() => logoutAction()}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                    {/* ... other buttons ... */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                    <div key={event._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-galaxy-purple/30 transition-all group flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-galaxy-accent uppercase tracking-wider">{event.type}</span>
                                    {event.activeDays && event.activeDays.length > 0 && (
                                        <span className="text-[10px] font-bold bg-white/10 text-gray-300 px-1.5 py-0.5 rounded">
                                            Day {[...event.activeDays].sort().join(', ')}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white group-hover:text-galaxy-purple transition-colors">{event.name}</h3>
                            </div>
                            <span className="text-lg font-bold text-white/50">₹{event.price}</span>
                        </div>

                        {/* ... rest of card ... */}


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

                            <QuickExport eventId={event._id} eventName={event.name} />

                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this event?')) {
                                        // Optimistic Update
                                        const originalEvents = [...events];
                                        setEvents(events.filter(e => e._id !== event._id));

                                        try {
                                            const result = await deleteEventAction(event._id);
                                            if (result.error) {
                                                throw new Error(result.error);
                                            }
                                            // Success: Data is already gone from UI. 
                                            // We can trigger a silent re-fetch to ensure sync with DB, but it's not blocking the UI.
                                            fetchData();
                                        } catch (error) {
                                            console.error("Deletion failed:", error);
                                            alert("Failed to delete event. Restoration initiated.");
                                            setEvents(originalEvents); // Rollback
                                        }
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

            {/* Rapid Payment Modal */}
            {showDesk && (
                <Suspense fallback={null}>
                    <OfflineDeskWrapper onClose={() => setShowDesk(false)} />
                </Suspense>
            )}
        </div>
    );
}

// Lazy load the panel for performance
import dynamic from 'next/dynamic';
const OfflineDeskWrapper = dynamic(() => import('@/components/admin/OfflineDeskPanel'), {
    ssr: false
});
import QuickExport from '@/components/admin/QuickExport';

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading Admin...</div>}>
            <AdminContent />
        </Suspense>
    );
}

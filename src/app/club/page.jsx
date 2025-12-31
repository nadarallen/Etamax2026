'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Plus, Settings, LogOut, Edit, Unlock, Trash2 } from 'lucide-react';
import { deleteEventAction } from '@/server-actions/events';

export default function ClubDashboard() {
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/club/events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch club data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="min-h-screen pt-24 text-white text-center">Loading Club Dashboard...</div>;

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">

            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-widest flex items-center gap-3">
                        <LayoutDashboard className="text-galaxy-purple" />
                        CLUB DASHBOARD
                    </h1>
                    <p className="text-gray-400 mt-2">Manage Your Club Events</p>
                </div>
                <form action="/api/auth/signout" method="post">
                    {/* In a real app we use a Server Action to logout, or client router push after cookie delete */}
                    <Link href="/login">
                        <button className="flex items-center gap-2 px-6 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors h-full">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </Link>
                </form>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">My Events</p>
                    <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Bookings</p>
                    <p className="text-2xl font-bold text-white">{stats.totalRegistrations}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">My Events</h2>
                <Link href="/admin/create-event">
                    <button
                        className="bg-galaxy-purple/20 hover:bg-galaxy-purple/30 text-galaxy-purple border border-galaxy-purple/50 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Create Event
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
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Status:</span>
                                <span className={event.isPublished ? "text-green-400" : "text-yellow-400"}>
                                    {event.isPublished ? 'Published' : 'Draft'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {/* Reuse Admin Slot Page, assumes /admin/events route is accessible or we make a different route */}
                            {/* Ideally /club/events/[id]/slots, but let's reuse /admin route if RBAC allows or generic route */}
                            {/* Creating a dynamic route in club folder is safer */}
                            <Link href={`/club/events/${event._id}/slots`} className="flex-1">
                                <button className="w-full flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium transition-colors border border-green-500/20">
                                    <Unlock size={14} /> Slots
                                </button>
                            </Link>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this event?')) {
                                        await deleteEventAction(event._id);
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
                        You haven't created any events yet.
                    </div>
                )}
            </div>
        </div>
    );
}

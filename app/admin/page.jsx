'use client';
import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import eventsData from '@/data/events.json';
import { Settings, Lock, Unlock, Edit, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage({ searchParams }) {
    const router = useRouter();
    // In Next.js 15+, searchParams is a promise, but in 14 it's an object or we use hook. 
    // The user didn't specify version, but usually app router text searchParams prop is available in page.
    // However, since we are client side for interactivity (buttons), let's use useSearchParams for safety or just check prop if server component.
    // The prompt asked for "UI ONLY", but "Admin access is controlled ONLY via URL parameter". 
    // Let's make it a Client Component to handle current URL params easily or Server Component if we want strict server redirect.
    // Client component is often easier for "No backend" mock dashboards.

    // Let's stick to Client Component pattern for this simple mock.
    const searchParamsHook = useSearchParams();
    const key = searchParamsHook.get('key');
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (key !== 'ETAMAX_ADMIN_2026') {
            router.push('/events');
        } else {
            setAuthorized(true);
        }
    }, [key, router]);

    if (!authorized) return null;

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
                <Link href="/events">
                    <button className="flex items-center gap-2 px-6 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut size={16} />
                        Exit
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsData.map((event) => (
                    <div key={event.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-galaxy-purple/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold text-galaxy-accent uppercase tracking-wider">{event.type}</span>
                                <h3 className="text-xl font-bold text-white mt-1 group-hover:text-galaxy-purple transition-colors">{event.name}</h3>
                            </div>
                            <span className="text-lg font-bold text-white/50">₹{event.price}</span>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Registrations:</span>
                                <span className="text-white">124 (Mock)</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Revenue:</span>
                                <span className="text-white">₹{124 * event.price}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-white/5">
                                <Edit size={14} /> Edit
                            </button>
                            <button className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium transition-colors border border-green-500/20">
                                <Unlock size={14} /> Open
                            </button>
                            {/* Mock state for open/close */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

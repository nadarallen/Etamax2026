'use client';

import { useState, useEffect } from 'react';
import { searchDeskRegistrationsAction, confirmDeskPaymentAction } from '@/server-actions/desk';
import { Search, CheckCircle, Clock, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function DeskPage() {
    const [query, setQuery] = useState('');
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchResults();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const fetchResults = async () => {
        setLoading(true);
        const res = await searchDeskRegistrationsAction(query);
        if (res.success) {
            setRegistrations(res.registrations);
        }
        setLoading(false);
    };

    const handleConfirm = async () => {
        if (!confirmModal) return;
        setProcessing(true);
        const res = await confirmDeskPaymentAction(confirmModal._id);

        if (res.success) {
            // Update UI Optimistically
            setRegistrations(prev => prev.map(r =>
                r._id === confirmModal._id ? { ...r, status: 'CONFIRMED' } : r
            ));
            setConfirmModal(null);
            // Optionally show toast
        } else {
            alert(res.error || 'Failed to confirm');
        }
        setProcessing(false);
    };

    return (
        <div className="min-h-screen pt-24 px-4 pb-20 max-w-7xl mx-auto text-white">

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        <ShieldCheck className="text-galaxy-purple" />
                        DESK PANEL
                    </h1>
                    <p className="text-gray-400">Rapid Offline Payment Confirmation</p>
                </div>
                <Link href="/admin">
                    <button className="text-sm text-gray-400 hover:text-white transition-colors">
                        Exit to Dashboard
                    </button>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className={`w-6 h-6 ${loading ? 'text-galaxy-purple animate-pulse' : 'text-gray-400'}`} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-xl text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-all"
                    placeholder="Search Student Name, Roll No, or Email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Results */}
            <div className="space-y-4">
                {registrations.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        {query ? 'No student found.' : 'Start typing to search students...'}
                    </div>
                )}

                {registrations.map(reg => (
                    <div
                        key={reg._id}
                        className={`bg-white/5 border ${reg.status === 'CONFIRMED' ? 'border-green-500/20 bg-green-500/5' : 'border-white/10'} rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:border-white/20`}
                    >
                        {/* Student Details */}
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white">{reg.fullName}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mt-1">
                                <span className="text-galaxy-purple font-mono bg-galaxy-purple/10 px-2 py-0.5 rounded">{reg.rollNumber}</span>
                                <span>{reg.branch} - Sem {reg.semester}</span>
                                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(reg.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 md:text-center">
                            <div className="text-white font-medium">{reg.eventId?.name || 'Unknown Event'}</div>
                            <div className="text-xs text-gray-400">
                                {reg.slotId ? `Day ${reg.slotId.dayNumber} • ${reg.slotId.startTime}` : 'Slot Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">{reg.eventId?.price > 0 ? `₹${reg.eventId.price}` : 'Free'}</div>
                        </div>

                        {/* Status / Action */}
                        <div className="flex items-center gap-4 min-w-[200px] justify-end">
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${reg.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                                    reg.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {reg.status}
                            </span>

                            {reg.status === 'PENDING' && reg.paymentMethod === 'OFFLINE' && (
                                <button
                                    onClick={() => setConfirmModal(reg)}
                                    className="px-6 py-2 bg-gradient-to-r from-galaxy-purple to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-galaxy-purple/50 active:scale-95 transition-all text-sm whitespace-nowrap"
                                >
                                    Confirm Cash
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Confirm Payment?</h3>

                        <div className="bg-white/5 p-4 rounded-xl mb-6 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Student</span>
                                <span className="text-white font-medium">{confirmModal.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Event</span>
                                <span className="text-white font-medium">{confirmModal.eventId?.name}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                                <span className="text-gray-400">Amount to Collect</span>
                                <span className="text-xl font-bold text-green-400">₹{confirmModal.eventId?.price}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                disabled={processing}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={processing}
                                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                {processing ? <RefreshCw className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                Confirm Received
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

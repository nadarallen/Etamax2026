'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Clock, ChevronRight, User, Users, Calendar, MapPin, RefreshCw } from 'lucide-react';
import { findGlobalStudentsAction, getStudentFullDetailsAction, confirmDeskPaymentAction } from '@/server-actions/desk';

export default function RapidPaymentPanel({ onClose }) {
    const [view, setView] = useState('SEARCH'); // SEARCH | DETAILS
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selected Data
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null); // ID of reg being confirmed

    const searchInputRef = useRef(null);

    // Auto-focus search on mount
    useEffect(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
    }, []);

    // Debounced Search
    useEffect(() => {
        const delay = setTimeout(() => {
            if (query.length >= 2) performSearch();
            else setResults([]);
        }, 400);
        return () => clearTimeout(delay);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        const res = await findGlobalStudentsAction(query);
        if (res.success) setResults(res.students);
        setLoading(false);
    };

    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setView('DETAILS');
        setDetailsLoading(true);
        const res = await getStudentFullDetailsAction(student._id);
        if (res.success) setRegistrations(res.registrations);
        setDetailsLoading(false);
    };

    const handleConfirmPayment = async (regId) => {
        if (!confirm('Are you sure you want to confirm CASH payment for this event?')) return;

        setProcessingId(regId);
        const res = await confirmDeskPaymentAction(regId);

        if (res.success) {
            // Optimistic Update
            setRegistrations(prev => prev.map(r =>
                r._id === regId ? { ...r, status: 'CONFIRMED' } : r
            ));
            // Optional: Show toast
        } else {
            alert(res.error || 'Confirmation Failed');
        }
        setProcessingId(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end backdrop-blur-sm bg-black/40">
            <div className="w-full max-w-2xl h-full bg-[#0F1014] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#15161A]">
                    <div>
                        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                            ⚡ RAPID PAYMENT
                        </h2>
                        <p className="text-xs text-gray-400">Desk Operator Mode</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* View 1: Search */}
                    {view === 'SEARCH' && (
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search by Name, Roll No, or Email..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-all"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>

                            {/* Results List */}
                            <div className="space-y-2">
                                {loading && <div className="text-center text-gray-500 py-4">Searching...</div>}

                                {!loading && results.length === 0 && query.length >= 2 && (
                                    <div className="text-center text-gray-500 py-4">No students found.</div>
                                )}

                                {results.map(student => (
                                    <button
                                        key={student._id}
                                        onClick={() => handleSelectStudent(student)}
                                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl transition-all group text-left"
                                    >
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-galaxy-purple transition-colors">
                                                {student.fullName}
                                            </h3>
                                            <div className="flex gap-3 text-xs text-gray-400 mt-1">
                                                <span className="font-mono bg-white/5 px-1.5 rounded">{student.rollNumber}</span>
                                                <span className="text-gray-500">{student.branch}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View 2: Details */}
                    {view === 'DETAILS' && selectedStudent && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

                            {/* Student Header */}
                            <div className="bg-gradient-to-r from-galaxy-purple/20 to-blue-500/10 border border-galaxy-purple/30 rounded-2xl p-6 relative overflow-hidden">
                                <div className="relative z-10">
                                    <button
                                        onClick={() => setView('SEARCH')}
                                        className="mb-4 text-xs font-bold text-galaxy-purple hover:underline flex items-center gap-1"
                                    >
                                        ← BACK TO SEARCH
                                    </button>
                                    <h1 className="text-2xl font-bold text-white">{selectedStudent.fullName}</h1>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-300">
                                        <div className="flex items-center gap-1.5">
                                            <span className="bg-black/30 px-2 py-0.5 rounded font-mono text-xs">{selectedStudent.rollNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-75">
                                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                            {selectedStudent.branch}
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-75">
                                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                            {selectedStudent.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Registrations List */}
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-8">Registered Events</h3>

                            {detailsLoading ? (
                                <div className="text-center py-8 text-white">Loading Events...</div>
                            ) : registrations.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                    No registrations found for this student.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {registrations.map(reg => (
                                        <div
                                            key={reg._id}
                                            className={`relative group bg-[#1A1B1F] border rounded-xl overflow-hidden transition-all ${reg.status === 'CONFIRMED' ? 'border-green-500/30 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]' :
                                                    reg.status === 'PENDING' ? 'border-yellow-500/30 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]' :
                                                        'border-white/10'
                                                }`}
                                        >
                                            <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

                                                {/* Event Info */}
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-bold text-white">{reg.eventId?.name}</h4>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${reg.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                                                                reg.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {reg.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                                                        {reg.team && (
                                                            <span className="flex items-center gap-1.5 text-blue-300">
                                                                <Users size={12} /> {reg.team.name}
                                                            </span>
                                                        )}
                                                        {reg.slotId && (
                                                            <>
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar size={12} /> Day {reg.slotId.dayNumber}
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock size={12} /> {reg.slotId.startTime}
                                                                </span>
                                                                <span className="flex items-center gap-1.5 text-orange-300">
                                                                    <MapPin size={12} /> {reg.slotId.venue}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Side */}
                                                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 uppercase">Amount</p>
                                                        <p className="text-xl font-bold text-white">
                                                            {reg.eventId?.price > 0 ? `₹${reg.eventId.price}` : 'Free'}
                                                        </p>
                                                    </div>

                                                    {reg.status === 'PENDING' && (reg.paymentMethod?.toUpperCase() === 'OFFLINE') ? (
                                                        <button
                                                            onClick={() => handleConfirmPayment(reg._id)}
                                                            disabled={processingId === reg._id}
                                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center gap-2"
                                                        >
                                                            {processingId === reg._id ? <RefreshCw className="animate-spin w-4 h-4" /> : <CheckCircle size={16} />}
                                                            Confirm
                                                        </button>
                                                    ) : reg.status === 'CONFIRMED' ? (
                                                        <div className="bg-green-500/10 p-2 rounded-full text-green-500">
                                                            <CheckCircle size={24} />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Team Roster (View Only) */}
                                            {reg.team && reg.team.members && (
                                                <div className="bg-black/20 border-t border-white/5 px-5 py-3 flex flex-wrap gap-3">
                                                    <span className="text-xs text-gray-500 uppercase self-center mr-2">Team:</span>
                                                    {reg.team.members.map((m, i) => (
                                                        <span key={i} className={`text-xs px-2 py-1 rounded border ${m.status === 'CONFIRMED' || m.status === 'JOINED' // Simplified for view
                                                                ? 'bg-white/5 border-white/10 text-gray-300'
                                                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                                                            }`}>
                                                            {m.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Clock, ChevronRight, User, Users, Calendar, MapPin, RefreshCw, WalletCards } from 'lucide-react';
import { findGlobalStudentsAction, getStudentFullDetailsAction, confirmDeskPaymentAction, approveBatchRegistrationsAction } from '@/server-actions/desk';

export default function OfflineDeskPanel({ onClose }) {
    const [view, setView] = useState('SEARCH'); // SEARCH | DETAILS
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selected Data
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null); // ID of reg being confirmed
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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
        if (!confirm('Confirm CASH payment for this event?')) return;

        setProcessingId(regId);
        const res = await confirmDeskPaymentAction(regId);

        if (res.success) {
            setRegistrations(prev => prev.map(r =>
                r._id === regId ? { ...r, status: 'CONFIRMED' } : r
            ));
        } else {
            alert(res.error || 'Confirmation Failed');
        }
        setProcessingId(null);
    };

    const handleBulkConfirm = async () => {
        const pendingRegs = registrations.filter(r => r.status === 'PENDING');

        if (pendingRegs.length === 0) return;
        if (!confirm(`Confirm CASH payment for ALL ${pendingRegs.length} pending events?`)) return;

        setIsBulkProcessing(true);
        const ids = pendingRegs.map(r => r._id);
        const res = await approveBatchRegistrationsAction(ids);

        if (res.success) {
            setRegistrations(prev => prev.map(r =>
                ids.includes(r._id) ? { ...r, status: 'CONFIRMED' } : r
            ));
        } else {
            alert(res.error || 'Batch Confirmation Failed');
        }
        setIsBulkProcessing(false);
    };

    const pendingCount = registrations.filter(r => r.status === 'PENDING').length;
    const totalPendingAmount = registrations
        .filter(r => r.status === 'PENDING')
        .reduce((acc, curr) => acc + (curr.eventId?.price || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex justify-end backdrop-blur-sm bg-black/40">
            <div className="w-full max-w-2xl h-full bg-[#0F1014] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#15161A]">
                    <div>
                        <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                            <WalletCards className="text-green-400" /> OFFLINE DESK
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">Cash Payment Terminal</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                    {/* View 1: Search */}
                    {view === 'SEARCH' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-blue-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-400 transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search by ID, Name, Roll No..."
                                        className="w-full bg-[#1A1B1F] border border-white/10 rounded-xl py-5 pl-12 pr-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-xl"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Results List */}
                            <div className="space-y-3">
                                {loading && (
                                    <div className="flex justify-center py-12">
                                        <RefreshCw className="w-8 h-8 text-green-500 animate-spin opacity-50" />
                                    </div>
                                )}

                                {!loading && results.length === 0 && query.length >= 2 && (
                                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                        <p className="text-gray-400">No students found.</p>
                                    </div>
                                )}

                                {results.map(student => (
                                    <button
                                        key={student._id}
                                        onClick={() => handleSelectStudent(student)}
                                        className="w-full flex items-center justify-between p-5 bg-[#1A1B1F] hover:bg-[#202126] border border-white/5 hover:border-green-500/30 rounded-2xl transition-all group text-left shadow-lg hover:shadow-green-900/10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center text-green-400 font-bold text-sm">
                                                {student.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg group-hover:text-green-400 transition-colors">
                                                    {student.fullName}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm mt-1">
                                                    <span className="font-mono bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">{student.rollNumber}</span>
                                                    <span className="text-gray-500">{student.branch}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-600 group-hover:text-green-400 transition-all group-hover:translate-x-1" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View 2: Details */}
                    {view === 'DETAILS' && selectedStudent && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                            {/* Student Header */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1B1F] to-[#121316] border border-white/10 p-8">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                <div className="relative z-10">
                                    <button
                                        onClick={() => setView('SEARCH')}
                                        className="mb-6 text-xs font-bold text-green-500 hover:text-green-400 tracking-widest flex items-center gap-2 group transition-colors"
                                    >
                                        <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK TO SEARCH
                                    </button>

                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h1 className="text-3xl font-black text-white tracking-tight">{selectedStudent.fullName}</h1>
                                            <div className="flex flex-wrap gap-3 mt-3">
                                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg font-mono text-sm text-green-400 shadow-sm">
                                                    {selectedStudent.rollNumber}
                                                </span>
                                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-sm text-gray-300">
                                                    {selectedStudent.branch}
                                                </span>
                                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-sm text-gray-300">
                                                    ID: {selectedStudent._id.slice(-6)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bulk Action Bar - Sticky if needed, visually distinct */}
                            {pendingCount > 0 && (
                                <div className="bg-gradient-to-r from-green-900/20 to-green-900/10 border border-green-500/30 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
                                    <div className="text-center sm:text-left">
                                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Total Pending</p>
                                        <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                                            <p className="text-4xl font-black text-white">₹{totalPendingAmount}</p>
                                            <p className="text-sm text-gray-400 font-medium">for {pendingCount} event{pendingCount > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleBulkConfirm}
                                        disabled={isBulkProcessing}
                                        className="w-full sm:w-auto bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 group border-t border-white/20"
                                    >
                                        {isBulkProcessing ? <RefreshCw className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                        APPROVE ALL
                                    </button>
                                </div>
                            )}

                            {/* Registrations List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Registered Events</h3>
                                    <span className="text-xs text-gray-600 font-mono">{registrations.length} Total</span>
                                </div>

                                {detailsLoading ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
                                        <RefreshCw className="animate-spin text-green-500" />
                                        <span>Loading records...</span>
                                    </div>
                                ) : registrations.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        No registrations found.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {registrations.map(reg => {
                                            // Allow approving ANY pending registration (even if they tried online first)
                                            const isPending = reg.status === 'PENDING';
                                            const isConfirmed = reg.status === 'CONFIRMED';

                                            return (
                                                <div
                                                    key={reg._id}
                                                    className={`relative bg-[#1A1B1F] border rounded-2xl overflow-hidden transition-all duration-300 group
                                                        ${isConfirmed ? 'border-green-500/20 opacity-75 hover:opacity-100' :
                                                            isPending ? 'border-yellow-500/20 hover:border-yellow-500/40 shadow-lg' :
                                                                'border-white/5'
                                                        }`}
                                                >
                                                    {/* Status Strip */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isConfirmed ? 'bg-green-500' : isPending ? 'bg-yellow-500' : 'bg-gray-700'
                                                        }`}></div>

                                                    <div className="p-5 pl-7 flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center">

                                                        {/* Event Info */}
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                                                                    {reg.eventId?.name || 'Unknown Event'}
                                                                </h4>
                                                                {reg.team?.name && (
                                                                    <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-purple-500/20">Team: {reg.team.name}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                                                                <span className="text-white font-medium">₹{reg.eventId?.price || 0}</span>
                                                                <span>•</span>
                                                                <span>{reg.eventId?.type || 'Event'}</span>
                                                                {(reg.slotId || reg.team) && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="text-gray-500">
                                                                            {reg.slotId ? `Day ${reg.slotId.dayNumber}` : 'Slot Not Selected'}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Area */}
                                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">

                                                            {/* Status Badge (if not pending action) */}
                                                            {isConfirmed ? (
                                                                <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/10">
                                                                    <CheckCircle size={18} />
                                                                    <span>PAID</span>
                                                                </div>
                                                            ) : isPending ? (
                                                                <button
                                                                    onClick={() => handleConfirmPayment(reg._id)}
                                                                    disabled={processingId === reg._id || isBulkProcessing}
                                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all text-sm border-t border-white/20 whitespace-nowrap"
                                                                >
                                                                    {processingId === reg._id ? (
                                                                        <RefreshCw size={18} className="animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle size={18} />
                                                                    )}
                                                                    <span>Approve Cash</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs font-bold text-gray-500 bg-white/5 px-3 py-1 rounded uppercase tracking-wider">
                                                                    {reg.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

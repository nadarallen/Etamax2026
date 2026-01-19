'use client';

import { useState, useEffect } from 'react';
import { searchDeskRegistrationsAction, confirmDeskPaymentAction } from '@/server-actions/desk';
import { Search, CheckCircle, Clock, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function DeskPage() {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]); // Students found
    const [selectedStudent, setSelectedStudent] = useState(null); // Selected Student Full Details
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Debounced Search for STUDENTS
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) searchStudents();
            else setSearchResults([]);
        }, 400);
        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const searchStudents = async () => {
        setLoading(true);
        // Dynamic import needed? imported at top
        const { findGlobalStudentsAction } = await import('@/server-actions/desk');
        const res = await findGlobalStudentsAction(query);
        if (res.success) {
            setSearchResults(res.students);
        }
        setLoading(false);
    };

    const selectStudent = async (studentId) => {
        setLoading(true);
        setQuery(''); // Clear search? or keep name?
        setSearchResults([]); // Hide dropdown

        const { getStudentFullDetailsAction } = await import('@/server-actions/desk');
        const res = await getStudentFullDetailsAction(studentId);

        if (res.success) {
            // Find student basic info from results or res
            // Actually getStudentFullDetailsAction returns list of regs. 
            // We can extract user details from the first reg OR we might need to fetch user separately?
            // Wait, getStudentFullDetailsAction returns regs. 
            // We need a way to show "Student Name" even if they have 0 regs?
            // The previous action findGlobalStudentsAction gives us basic info.
            // Let's store the student info from the search result.
            // Find matching student from searchResults
            // Issue: searchResults might be cleared. 
            // Logic: Pass student object to this function.
        }
        setLoading(false);
    };

    // Improved Select Handler
    const handleSelectStudent = async (student) => {
        setLoading(true);
        setSearchResults([]);
        setQuery(student.fullName); // Show selected name
        setSelectedStudent(student);

        const { getStudentFullDetailsAction } = await import('@/server-actions/desk');
        const res = await getStudentFullDetailsAction(student._id);

        if (res.success) {
            setRegistrations(res.registrations);
        }
        setLoading(false);
    };

    const handleBatchApprove = async () => {
        const pendingRegs = registrations.filter(r => r.status === 'PENDING');
        if (pendingRegs.length === 0) return;

        if (!confirm(`Approve payment for ${pendingRegs.length} events? Total: ₹${pendingRegs.reduce((sum, r) => sum + (r.eventId?.price || 0), 0)}`)) return;

        setProcessing(true);
        const { approveBatchRegistrationsAction } = await import('@/server-actions/desk');
        const ids = pendingRegs.map(r => r._id);

        const res = await approveBatchRegistrationsAction(ids);

        if (res.success) {
            // Refresh
            handleSelectStudent(selectedStudent);
            alert(res.message);
        } else {
            alert(res.error);
        }
        setProcessing(false);
    };

    // Single Approve
    const handleSingleApprove = async (regId) => {
        if (!confirm("Confirm single payment?")) return;
        setProcessing(true);
        const { confirmDeskPaymentAction } = await import('@/server-actions/desk');
        const res = await confirmDeskPaymentAction(regId);
        if (res.success) {
            // Refresh
            handleSelectStudent(selectedStudent);
        } else {
            alert(res.error);
        }
        setProcessing(false);
    }

    return (
        <div className="min-h-screen pt-24 px-4 pb-20 max-w-6xl mx-auto text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        <ShieldCheck className="text-galaxy-purple" />
                        RAPID DESK
                    </h1>
                    <p className="text-gray-400">Search User &rarr; Payment &rarr; Approve All</p>
                </div>
                <Link href="/admin">
                    <button className="text-sm text-gray-400 hover:text-white transition-colors">Exit to Dashboard</button>
                </Link>
            </div>

            {/* 1. Search Section */}
            <div className="relative mb-8 z-50">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className={`w-6 h-6 ${loading ? 'text-galaxy-purple animate-pulse' : 'text-gray-400'}`} />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-xl text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-all"
                        placeholder="Start typing Name, Roll No or Email..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!e.target.value) {
                                setSelectedStudent(null);
                                setRegistrations([]);
                            }
                        }}
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setSearchResults([]); setSelectedStudent(null); setRegistrations([]); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Dropdown Results */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-galaxy-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto">
                        {searchResults.map(student => (
                            <div
                                key={student._id}
                                onClick={() => handleSelectStudent(student)}
                                className="p-4 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center transition-colors"
                            >
                                <div>
                                    <div className="font-bold text-white">{student.fullName}</div>
                                    <div className="text-sm text-gray-400">{student.email}</div>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    <div className="font-mono text-galaxy-purple">{student.rollNumber}</div>
                                    <div>{student.branch}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Selected Student View */}
            {selectedStudent && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedStudent.fullName}</h2>
                            <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                <span>{selectedStudent.rollNumber}</span>
                                <span>•</span>
                                <span>{selectedStudent.branch} (Sem {selectedStudent.semester})</span>
                            </div>
                        </div>

                        {/* Batch Action */}
                        {registrations.some(r => r.status === 'PENDING') && (
                            <button
                                onClick={handleBatchApprove}
                                disabled={processing}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {processing ? <RefreshCw className="animate-spin" /> : <CheckCircle />}
                                Approve ALL Pending
                            </button>
                        )}
                    </div>

                    {/* Registrations List */}
                    <div className="space-y-4">
                        {registrations.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl">
                                No registrations found for this student.
                            </div>
                        ) : (
                            registrations.map(reg => (
                                <div
                                    key={reg._id}
                                    className={`bg-white/5 border rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group 
                                        ${reg.status === 'CONFIRMED' ? 'border-green-500/30' : 'border-white/10'}`}
                                >
                                    {reg.status === 'CONFIRMED' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}

                                    <div className="flex-1">
                                        <div className="text-xl font-bold text-white">{reg.eventId?.name || 'Event Removed / Unknown'}</div>
                                        <div className="text-sm text-gray-400 mt-1">
                                            {reg.slotId ? `Day ${reg.slotId.dayNumber} • ${reg.slotId.startTime} - ${reg.slotId.endTime}` : 'No Slot Info'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">{reg.slotId?.venue || 'Venue TBD'}</div>
                                        {!reg.eventId && <span className="text-red-500 text-xs">Event Data Missing</span>}
                                    </div>

                                    <div className="flex flex-col items-end md:items-center gap-1 min-w-[100px]">
                                        <div className="text-2xl font-black text-white">
                                            {reg.eventId?.price ? `₹${reg.eventId.price}` : 'FREE'}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase">{reg.eventId?.type}</div>
                                    </div>

                                    <div className="flex items-center gap-4 min-w-[150px] justify-end">
                                        {reg.status === 'CONFIRMED' ? (
                                            <div className="flex items-center gap-2 text-green-400 font-bold bg-green-500/10 px-4 py-2 rounded-lg">
                                                <CheckCircle size={18} /> Paid
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleSingleApprove(reg._id)}
                                                disabled={processing}
                                                className="bg-white/10 hover:bg-green-500 hover:text-white text-gray-300 font-medium px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                Approve {reg.paymentMethod !== 'OFFLINE' && <span className="text-[10px] bg-red-500/20 px-1 rounded text-red-300">(Override)</span>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Download, Search, Check, X } from 'lucide-react';
import { getStudentAnalyticsAction } from '@/server-actions/analytics';
import { resendPasswordEmailAction } from '@/server-actions/email-controls';
import { User } from 'lucide-react';

export default function StudentAnalyticsView() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                const res = await getStudentAnalyticsAction();
                if (res.success) {
                    setStudents(res.data);
                }
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Hardcoded branches to ensure all are visible even if no data exists
    const branches = ['All', 'COMPS', 'CSE/IT', 'MECH', 'ELECT', 'EXTC', 'BSH'];

    // Filter Logic
    const filteredStudents = students.filter(student => {
        const matchesBranch = selectedBranch === 'All' || student.branch === selectedBranch;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            student.name.toLowerCase().includes(searchLower) ||
            student.rollNumber.toLowerCase().includes(searchLower) ||
            student.email.toLowerCase().includes(searchLower) ||
            (student.phone && student.phone.includes(searchLower));

        return matchesBranch && matchesSearch;
    });

    // CSV Download Logic
    const handleResendPassword = async (userId) => {
        if (!confirm('WARNING: This will RESET the users password and email them the new one. Continue?')) return;
        const res = await resendPasswordEmailAction(userId);
        if (res.success) alert(res.message);
        else alert(res.error);
    };

    const downloadCSV = () => {
        const headers = ['Roll Number', 'Name', 'Email', 'Phone', 'Branch', 'Semester', 'Payment Status', 'Criteria Met', 'Tech', 'Cultural', 'Seminar', 'Events Participated'];
        const rows = filteredStudents.map(s => [
            s.rollNumber,
            s.name,
            s.email,
            s.phone || 'N/A',
            s.branch,
            s.semester,
            s.branch,
            s.semester,
            s.paymentStatus,
            s.criteria.met ? 'Yes' : 'No',
            s.criteria.details.Technical ? 'Yes' : 'No',
            s.criteria.details.Cultural ? 'Yes' : 'No',
            s.criteria.details.Seminar ? 'Yes' : 'No',
            s.registrations.map(r => `${r.eventName} (${r.category}) [${r.status}]`).join('; ')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `student_analytics_${selectedBranch}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-white text-center py-20">Loading student data...</div>;

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-galaxy-purple/50"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-galaxy-purple/50 [&>option]:bg-black"
                    >
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-white/5 uppercase text-xs font-bold text-gray-400">
                            <tr>
                                <th className="p-4">Student Details</th>
                                <th className="p-4">Context</th>
                                <th className="p-4 text-center">Payment</th>
                                <th className="p-4 text-center">Criteria Status</th>
                                <th className="p-4 text-center">Technical</th>
                                <th className="p-4 text-center">Cultural</th>
                                <th className="p-4 text-center">Seminar</th>
                                <th className="p-4">Events</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-500">No students found.</td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{student.name}</div>
                                            <div className="text-xs text-gray-400">{student.rollNumber}</div>
                                            <div className="text-xs text-gray-500">{student.email}</div>
                                            <div className="text-xs text-gray-500">{student.phone || 'N/A'}</div>
                                            <button
                                                onClick={() => handleResendPassword(student.id)}
                                                className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded border border-blue-500/20 transition-colors w-fit"
                                                title="Reset Password & Email"
                                            >
                                                <User size={10} /> Reset PWD
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-white">{student.branch}</div>
                                            <div className="text-xs text-gray-500">Sem {student.semester}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {student.paymentStatus === 'CONFIRMED' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                    ✓ Paid
                                                </span>
                                            ) : student.paymentStatus === 'PENDING' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
                                                    No Reg
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {student.criteria.met ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                    Eligible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                    {student.criteria.count}/3 Completed
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {student.criteria.details.Technical ? (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400 border border-green-500/50">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-500/20 text-red-400 border border-red-500/50">
                                                    <X size={14} strokeWidth={3} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {student.criteria.details.Cultural ? (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400 border border-green-500/50">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-500/20 text-red-400 border border-red-500/50">
                                                    <X size={14} strokeWidth={3} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {student.criteria.details.Seminar ? (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400 border border-green-500/50">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-500/20 text-red-400 border border-red-500/50">
                                                    <X size={14} strokeWidth={3} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {student.registrations.map((reg, idx) => (
                                                    <span key={idx} className="bg-white/10 px-2 py-1 rounded text-xs font-medium text-white">
                                                        {reg.eventName}
                                                    </span>
                                                ))}
                                                {student.registrations.length === 0 && <span className="text-gray-600 italic">None</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="text-gray-500 text-xs text-center">
                Showing {filteredStudents.length} students
            </div>
        </div>
    );
}

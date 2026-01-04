'use client';

import { useEffect, useState, use } from 'react';
import { getEventRegistrationsAction } from '@/server-actions/events';
import { updateRegistrationStatusAction } from '@/server-actions/registration';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, RefreshCw, Search, Mail, User, Calendar, Filter, Crown } from 'lucide-react';
import Link from 'next/link';

export default function ClubEventRegistrationsPage({ params }) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [refreshing, setRefreshing] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const fetchData = async (pageNumber = page) => {
        setRefreshing(true);
        const res = await getEventRegistrationsAction(id, pageNumber);
        if (res.success) {
            setRegistrations(res.registrations);
            setPagination(res.pagination);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
        // Optional: Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchData(), 30000);
        return () => clearInterval(interval);
    }, [id, page]);

    const downloadCSV = () => {
        const headers = ['ID', 'Name', 'Roll Number', 'Email', 'Branch', 'Semester', 'Slot Time', 'Venue', 'Status', 'Payment Method'];
        const rows = registrations.map(reg => [
            reg.etamaxId || 'N/A',
            reg.fullName,
            reg.rollNumber,
            reg.email,
            reg.branch,
            reg.semester,
            reg.slotId ? `${reg.slotId.startTime || '?'} - ${reg.slotId.endTime || '?'} (Day ${reg.slotId.dayNumber || '?'})` : 'N/A',
            reg.slotId?.venue || 'N/A',
            reg.status,
            reg.paymentMethod
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `registrations-${id}.csv`;
        link.click();
    };

    const handleStatusChange = async (regId, newStatus) => {
        if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        const res = await updateRegistrationStatusAction(regId, newStatus);

        if (res.success) {
            setRegistrations(prev => prev.map(r =>
                r._id === regId ? { ...r, status: res.newStatus } : r
            ));
        } else {
            alert('Failed to update status: ' + res.error);
        }
    };

    const filtered = registrations.filter(reg => {
        const matchesSearch =
            reg.fullName.toLowerCase().includes(search.toLowerCase()) ||
            reg.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
            reg.email.toLowerCase().includes(search.toLowerCase()) ||
            (reg.etamaxId && reg.etamaxId.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto text-white pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Link href="/club" className="inline-flex items-center text-gray-400 hover:text-white mb-2 transition-colors">
                        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold font-display tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        Event Registrations
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Total: <span className="text-white font-bold">{registrations.length}</span> Users
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Name, Roll No, Email, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 appearance-none focus:outline-none focus:border-purple-500 transition-colors text-white cursor-pointer"
                        style={{ backgroundImage: 'none' }}
                    >
                        <option value="ALL" className="bg-gray-900 text-white">All Statuses</option>
                        <option value="PENDING" className="bg-gray-900 text-white">Pending (Offline)</option>
                        <option value="CONFIRMED" className="bg-gray-900 text-white">Confirmed</option>
                        <option value="CANCELLED" className="bg-gray-900 text-white">Cancelled</option>
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    {filtered.some(reg => reg.teamId) ? (
                        /* --- TEAM VIEW --- */
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">Team Details</th>
                                    <th className="p-4 font-medium">Members & Status</th>
                                    <th className="p-4 font-medium">Slot Info</th>
                                    <th className="p-4 font-medium text-right">Team Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading...</td></tr>
                                ) : (
                                    Object.values(filtered.reduce((acc, reg) => {
                                        if (!reg.teamId) return acc; // Skip orphans in team view? Or handle separate
                                        const tId = reg.teamId._id;
                                        if (!acc[tId]) {
                                            acc[tId] = {
                                                team: reg.teamId,
                                                slot: reg.slotId,
                                                createdAt: reg.teamId.createdAt || reg.createdAt,
                                                members: []
                                            };
                                        }
                                        acc[tId].members.push(reg);
                                        return acc;
                                    }, {})).map((group) => (
                                        <tr key={group.team._id} className="hover:bg-white/5 transition-colors align-top">
                                            {/* Column 1: Team Info */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-lg text-white">{group.team.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-galaxy-purple font-mono bg-galaxy-purple/10 px-1.5 py-0.5 rounded border border-galaxy-purple/20">
                                                            {group.team.code}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{group.members.length} Members</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Members List with Status */}
                                            <td className="p-4">
                                                <div className="space-y-3">
                                                    {group.members.map((member) => (
                                                        <div key={member._id} className="flex items-center justify-between gap-4 bg-black/20 p-2 rounded-lg border border-white/5">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.userId === group.team.leaderId ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'
                                                                    }`}>
                                                                    {member.userId === group.team.leaderId ? 'L' : 'M'}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm text-white font-medium flex items-center gap-1">
                                                                        {member.fullName}
                                                                        {member.userId === group.team.leaderId && (
                                                                            <Crown size={14} className="text-yellow-400 fill-yellow-400/20" />
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-500">{member.rollNumber} • {member.branch}</div>
                                                                </div>
                                                            </div>

                                                            {/* Status Dropdown */}
                                                            <div className="relative">
                                                                <select
                                                                    value={member.status}
                                                                    onChange={(e) => handleStatusChange(member._id, e.target.value)}
                                                                    className={`appearance-none pl-2 pr-6 py-1 rounded text-[10px] font-bold border cursor-pointer focus:outline-none ${member.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                        member.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                                                        }`}
                                                                >
                                                                    <option value="CONFIRMED" className="bg-gray-900">PAID</option>
                                                                    <option value="PENDING" className="bg-gray-900">PENDING</option>
                                                                    <option value="CANCELLED" className="bg-gray-900">CANCELLED</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Column 3: Slot Info */}
                                            <td className="p-4 text-sm text-gray-300">
                                                {group.slot ? (
                                                    <div>
                                                        <div className="text-green-400 font-medium mb-1">Day {group.slot.dayNumber}</div>
                                                        <div className="text-gray-400 text-xs">{group.slot.startTime} - {group.slot.endTime}</div>
                                                        <div className="text-gray-500 text-xs mt-1">📍 {group.slot.venue}</div>
                                                    </div>
                                                ) : <span className="text-gray-600 italic">No Slot</span>}
                                            </td>

                                            {/* Column 4: Timestamp */}
                                            <td className="p-4 text-right text-xs text-gray-500 font-mono">
                                                {new Date(group.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* --- SOLO / LEGACY VIEW --- */
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">User Details</th>
                                    <th className="p-4 font-medium">Academic Info</th>
                                    <th className="p-4 font-medium">Slot Info</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Registered At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading registrations...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No registrations found matching your search.</td></tr>
                                ) : (
                                    filtered.map((reg) => (
                                        <tr key={reg._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-purple-300 border border-white/5">
                                                        {reg.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">{reg.fullName}</div>
                                                        <div className="text-xs text-purple-400 font-mono mb-0.5">{reg.etamaxId || 'NO-ID'}</div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} /> {reg.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-300">{reg.rollNumber}</div>
                                                <div className="text-xs text-gray-500">{reg.branch} • Sem {reg.semester}</div>
                                            </td>
                                            <td className="p-4">
                                                {reg.slotId ? (
                                                    <div className="text-sm text-gray-300">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                                            Day {reg.slotId.dayNumber || '?'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{reg.slotId.startTime || '?'} - {reg.slotId.endTime || '?'}</div>
                                                    </div>
                                                ) : <span className="text-gray-600 text-xs italic">Slot Deleted</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="relative">
                                                    <select
                                                        value={reg.status}
                                                        onChange={(e) => handleStatusChange(reg._id, e.target.value)}
                                                        className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${reg.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20 focus:ring-green-500' :
                                                            reg.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 focus:ring-yellow-500' :
                                                                'bg-red-500/10 text-red-400 border-red-500/20 focus:ring-red-500'
                                                            }`}
                                                    >
                                                        <option value="CONFIRMED" className="bg-gray-900 text-green-400">CONFIRMED</option>
                                                        <option value="PENDING" className="bg-gray-900 text-yellow-400">PENDING</option>
                                                        <option value="CANCELLED" className="bg-gray-900 text-red-400">CANCELLED</option>
                                                    </select>
                                                </div>
                                                <div className="mt-1 opacity-50 text-[10px] uppercase font-mono ml-1">{reg.paymentMethod}</div>
                                            </td>
                                            <td className="p-4 text-right text-xs text-gray-500 font-mono">
                                                {new Date(reg.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
                <div>
                    Showing {pagination ? (pagination.current - 1) * pagination.limit + 1 : 0} to {pagination ? Math.min(pagination.current * pagination.limit, pagination.total) : 0} of {pagination?.total || 0} entries
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={page === 1 || loading}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        Page {pagination?.current || 1} of {pagination?.pages || 1}
                    </span>
                    <button
                        disabled={!pagination || page >= pagination.pages || loading}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div >
    );
}

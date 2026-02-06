'use client';

import { useState, useEffect } from 'react';
import { getAllUserPasswordsAction } from '@/server-actions/admin';
import { Search, Download, Copy, Eye, EyeOff, Key } from 'lucide-react';

export default function AdminPasswordsPage() {
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        async function fetchCredentials() {
            try {
                const result = await getAllUserPasswordsAction();
                if (result.error) {
                    alert(result.error);
                    return;
                }
                setCredentials(result.credentials || []);
            } catch (error) {
                console.error('Failed to fetch credentials:', error);
                alert('Failed to load user credentials');
            } finally {
                setLoading(false);
            }
        }

        fetchCredentials();
    }, []);

    const filteredCredentials = credentials.filter(cred =>
        cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cred.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cred.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Roll Number', 'Branch', 'Semester', 'Password', 'Created At'];
        const rows = filteredCredentials.map(cred => [
            cred.name,
            cred.email,
            cred.rollNumber,
            cred.branch,
            cred.semester,
            cred.password,
            new Date(cred.createdAt).toLocaleString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-credentials-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="text-center text-white">Loading user credentials...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                        <Key size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">All User Passwords</h1>
                        <p className="text-gray-400 text-sm">View and manage user credentials</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                    {/* Search */}
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or roll number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                        >
                            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                            {showPasswords ? 'Hide' : 'Show'} Passwords
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 transition-colors"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="mt-4 text-sm text-gray-400">
                    Showing {filteredCredentials.length} of {credentials.length} users
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/10 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Roll Number</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Branch</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCredentials.map((cred) => (
                                <tr key={cred.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-sm text-white">{cred.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-300">{cred.email}</td>
                                    <td className="px-4 py-3 text-sm text-gray-300">{cred.rollNumber}</td>
                                    <td className="px-4 py-3 text-sm text-gray-300">{cred.branch}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <code className="px-2 py-1 bg-white/10 rounded text-purple-400 font-mono">
                                                {showPasswords ? cred.password : '••••••••'}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(cred.password, cred.id)}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                title="Copy password"
                                            >
                                                {copiedId === cred.id ? (
                                                    <span className="text-green-400 text-xs">✓</span>
                                                ) : (
                                                    <Copy size={14} className="text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400">
                                        {new Date(cred.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredCredentials.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        No users found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}

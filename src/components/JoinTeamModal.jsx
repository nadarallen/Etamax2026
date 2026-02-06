'use client';

import { useState } from 'react';
import { joinTeamDirectAction } from '@/server-actions/team';
import { X, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function JoinTeamModal({ event, isOpen, onClose, onSuccess }) {
    const [teamCode, setTeamCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!teamCode.trim()) {
            setError('Please enter a team code');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(null);

        const result = await joinTeamDirectAction(event._id, teamCode.trim());

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else if (result.success) {
            setSuccess(result);
            setLoading(false);

            // Auto-close and refresh after 2 seconds
            setTimeout(() => {
                onSuccess?.();
                onClose();
                window.location.reload(); // Refresh to show updated teams
            }, 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 animate-in fade-in duration-200">
            <div className="bg-[#1A1B1F] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Users className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Join Team</h2>
                            <p className="text-xs text-gray-400">{event.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Team Code
                                </label>
                                <input
                                    type="text"
                                    value={teamCode}
                                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="w-full bg-[#0F1014] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-center text-2xl font-mono tracking-widest"
                                    autoFocus
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Ask your team leader for the code
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !teamCode.trim()}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Joining...
                                    </>
                                ) : (
                                    <>
                                        <Users size={20} />
                                        Join Team
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle className="text-green-400" size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {success.confirmed ? 'Registration Confirmed!' : 'Team Joined!'}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {success.message}
                                </p>
                            </div>
                            <div className="pt-4">
                                <p className="text-xs text-gray-500">Redirecting...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

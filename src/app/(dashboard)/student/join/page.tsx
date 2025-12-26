'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinPartyAction } from '@/server-actions/party';
import { Search, Users } from 'lucide-react';

export default function JoinPartyPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setIsLoading(true);
        setError('');

        const result = await joinPartyAction(code.toUpperCase());

        if (result.success) {
            router.push(`/student/party/${result.partyId}`);
        } else {
            setError(result.error || 'Failed to join');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
                        <Users className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Join a Squad</h2>
                    <p className="text-gray-400 mt-2">Enter the 6-character code shared by your team leader.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full bg-gray-800 border-2 border-gray-700 text-white text-center text-4xl tracking-[0.5em] font-mono py-4 rounded-xl focus:border-blue-500 focus:outline-none uppercase placeholder-gray-600"
                            placeholder="CODE"
                        />
                        {!code && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-600 text-sm mt-16">
                                e.g. XC9J2K
                            </span>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-center text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || code.length < 3}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? 'Searching...' : 'Join Team'}
                    </button>
                </form>
            </div>
        </div>
    );
}

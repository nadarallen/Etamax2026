'use client';

import { useFormState } from 'react-dom';
import { createClubUserAction } from '@/server-actions/admin-users';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const initialState = {
    error: '',
    success: false
};

export default function CreateClubPage() {
    const [state, action] = useFormState(createClubUserAction, initialState);
    const router = useRouter();

    useEffect(() => {
        if ((state as any)?.success) {
            alert("Club Account Created Successfully!");
            router.push('/admin/users');
        }
    }, [state, router]);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/users" className="text-gray-400 hover:text-white flex items-center mb-4 transition">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
                </Link>
                <h1 className="text-3xl font-bold text-white">Add Club Account</h1>
                <p className="text-gray-400 mt-2">Create a new login for a Club Representative.</p>
            </div>

            <form action={action} className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Club Name</label>
                    <input name="name" required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Coding Club" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input name="email" type="email" required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="club@etamax.com" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Initial Password</label>
                    <input name="password" type="password" required minLength={6} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" />
                </div>

                {state?.error && (
                    <div className="bg-red-900/20 border border-red-900/50 p-3 rounded text-red-500 text-sm">
                        {state.error}
                    </div>
                )}

                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition">
                    Create Club Account
                </button>
            </form>
        </div>
    );
}

'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { registerAction } from '@/server-actions/auth';

const initialState = {
    error: '',
};

// Simple selector for demo purposes
const ROLES = [
    { label: 'Student', value: 'STUDENT' },
    { label: 'Club Admin', value: 'CLUB_ADMIN' },
    // { label: 'Super Admin', value: 'SUPER_ADMIN' }, // Hidden for security in real app
];

export default function RegisterPage() {
    const [state, action] = useFormState(registerAction, initialState);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md rounded-2xl bg-gray-800 p-8 shadow-xl border border-gray-700">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white">Create Account</h1>
                    <p className="mt-2 text-gray-400">Join the fest today</p>
                </div>

                {state?.error && (
                    <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                        {state.error}
                    </div>
                )}

                <form action={action} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Full Name
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full rounded-lg border border-gray-600 bg-gray-700/50 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Email Address
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-lg border border-gray-600 bg-gray-700/50 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Role
                        </label>
                        <select
                            name="role"
                            className="w-full rounded-lg border border-gray-600 bg-gray-700/50 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full rounded-lg border border-gray-600 bg-gray-700/50 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-4 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        Create Account
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

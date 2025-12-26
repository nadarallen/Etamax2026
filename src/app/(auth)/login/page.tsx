'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { loginAction } from '@/server-actions/auth';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const initialState = {
    error: '',
};

function LoginForm() {
    const [state, action] = useFormState(loginAction, initialState);
    const searchParams = useSearchParams();
    const isSuccess = searchParams.get('success');

    return (
        <div className="w-full max-w-md rounded-2xl bg-gray-800 p-8 shadow-xl border border-gray-700">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                <p className="mt-2 text-gray-400">Sign in to manage your events</p>
            </div>

            {isSuccess && (
                <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-400 border border-green-500/20">
                    Account created! Please sign in.
                </div>
            )}

            {state?.error && (
                <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                    {state.error}
                </div>
            )}

            <form action={action} className="space-y-6">
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
                        Password
                    </label>
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full rounded-lg border border-gray-600 bg-gray-700/50 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                    Sign In
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300 transition">
                    Create account
                </Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}

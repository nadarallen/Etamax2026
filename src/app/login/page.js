'use client';
import { useActionState, useEffect, useState, Suspense } from 'react';
import { loginAction } from '@/server-actions/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

const initialState = {
    error: '',
};

function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginAction, initialState);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('success')) {
            // Optional: Show toast
        }
    }, [searchParams]);

    return (
        <div className="relative min-h-screen bg-galaxy-dark text-white overflow-hidden flex items-center justify-center p-4">

            {/* Auth Card */}
            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl hover:border-galaxy-purple/30 transition-all duration-300">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-galaxy-purple to-pink-500 mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 font-light">Login to manage your events</p>
                </div>

                {/* Form */}
                <form action={formAction} className="space-y-6">
                    {/* Success Message for Registration */}
                    {searchParams.get('registered') && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm text-center mb-4">
                            🎉 Account created! Check your email for password.
                        </div>
                    )}

                    {state?.error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                required
                                defaultValue={searchParams.get('email') || ''}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors"
                                placeholder="name@example.com"
                                suppressHydrationWarning
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    defaultValue={searchParams.get('password') || ''}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-galaxy-purple/20 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Logging In...
                            </span>
                        ) : 'Sign In'}
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-transparent text-gray-500 bg-[#0a0f29]/80 backdrop-blur">
                                New here?
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center">
                        <Link href="/register" className="text-galaxy-purple hover:text-pink-400 transition-colors font-medium">
                            Create an Account
                        </Link>
                    </div>

                </form>
            </div>

            {/* Simple footer */}
            <div className="absolute bottom-6 text-white/20 text-xs">
                ETAMAX 2026 Secured System
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-galaxy-dark flex items-center justify-center text-white">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

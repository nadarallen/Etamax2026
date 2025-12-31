'use client';
import { useActionState, useState } from 'react';
import { registerAction } from '@/server-actions/auth';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

const initialState = {
    error: '',
};

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(registerAction, initialState);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative min-h-screen bg-galaxy-dark text-white overflow-hidden flex items-center justify-center p-4">

            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl hover:border-galaxy-purple/30 transition-all duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-galaxy-purple to-pink-500 mb-2">
                        Get Started
                    </h1>
                    <p className="text-gray-400 font-light">Join the future at ETAMAX 2026</p>
                </div>

                <form action={formAction} className="space-y-5">
                    {state?.error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                            {state.error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Roll Number</label>
                        <input
                            type="text"
                            name="rollNumber"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors"
                            placeholder="e.g. 123456"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors pr-10"
                                placeholder="••••••••"
                                minLength={6}
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

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-galaxy-purple/20 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Creating Account...
                            </span>
                        ) : 'Create Account'}
                    </button>

                    <div className="text-center mt-6">
                        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Already have an account? <span className="text-galaxy-purple">Sign in</span>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

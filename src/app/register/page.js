'use client';
import { useActionState, useState } from 'react';
import { registerAction } from '@/server-actions/auth';
import Link from 'next/link';

const initialState = {
    error: '',
};

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(registerAction, initialState);

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
                            suppressHydrationWarning
                        />
                        <p className="text-xs text-yellow-400/80 mt-1.5 ml-1 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            Your login password will be sent to this email.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors"
                            placeholder="9876543210"
                            minLength={10}
                            maxLength={10}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Roll Number</label>
                        <input
                            type="text"
                            name="rollNumber"
                            required
                            maxLength={7}
                            minLength={7}
                            pattern="\d{7}"
                            title="Roll number must be exactly 7 digits"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors"
                            placeholder="e.g. 1234567"
                            onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Branch</label>
                        <select
                            name="branch"
                            required
                            defaultValue=""
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors [&>option]:bg-black"
                        >
                            <option value="" disabled>Select Branch</option>
                            <option value="COMPS">COMPS (Computer Engineering)</option>
                            <option value="CSE/IT">CSE/IT (Computer Science & Engg/IT)</option>
                            <option value="MECH">MECH (Mechanical Engineering)</option>
                            <option value="ELECT">ELECT (Electrical Engineering)</option>
                            <option value="EXTC">EXTC (Electronics & Telecomm)</option>
                            <option value="BSH">BSH (Basic Sciences & Humanities)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Semester</label>
                        <input
                            type="text"
                            name="semester"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors"
                            placeholder="e.g. 5"
                        />
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

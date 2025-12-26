'use client';

import { useState } from 'react';
import { Copy, Clock, Shield, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import PaymentGateway from './PaymentGateway';

// Prompt 16: Party Dashboard UI
export function PartyDashboardClient({ initialParty, currentUserId }: { initialParty: any, currentUserId: string }) {
    const [party] = useState(initialParty); // In real app, use SWR/React-Query for polling
    const currentUser = party.members.find((m: any) => m.userId._id === currentUserId);
    const isLeader = party.leaderId._id === currentUserId;

    const copyCode = () => {
        navigator.clipboard.writeText(party.code);
        alert("Code copied!");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Shield className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Team Dashboard</h2>
                            <h1 className="text-4xl font-bold text-white mb-2">{party.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-600/30">
                                    {party.status}
                                </span>
                                <span className="text-gray-400 text-sm flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> Expires in 58 mins
                                </span>
                            </div>
                        </div>

                        <div className="text-center bg-black/30 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <p className="text-xs text-gray-400 mb-1">TEAM CODE</p>
                            <button onClick={copyCode} className="text-3xl font-mono font-bold text-yellow-400 flex items-center gap-2 hover:text-yellow-300 transition">
                                {party.code} <Copy className="w-5 h-5 opacity-50" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Members List */}
                <div className="md:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-500" /> Squad Members
                        <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{party.members.length} / {party.eventId.maxTeamSize}</span>
                    </h3>

                    <div className="space-y-3">
                        {party.members.map((member: any) => (
                            <div key={member.userId._id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                                        {member.userId.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {member.userId.name}
                                            {member.userId._id === party.leaderId._id && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30">LEADER</span>}
                                        </p>
                                        <p className="text-xs text-gray-500">{member.userId.email}</p>
                                    </div>
                                </div>

                                <div>
                                    {member.paymentStatus === 'PAID' ? (
                                        <span className="text-green-400 text-xs font-bold flex items-center bg-green-900/20 px-2 py-1 rounded">
                                            PAID
                                        </span>
                                    ) : (
                                        <span className="text-yellow-400 text-xs font-bold flex items-center bg-yellow-900/20 px-2 py-1 rounded">
                                            PENDING
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Panel */}
                <div className="space-y-6">
                    {/* Payment Card */}
                    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                        <h3 className="text-white font-bold mb-4">Your Status</h3>

                        {currentUser?.paymentStatus === 'PAID' ? (
                            <div className="text-center py-8">
                                <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                <p className="text-green-400 font-bold">You are set!</p>
                                <p className="text-xs text-gray-500">Waiting for team...</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between text-sm mb-4">
                                    <span className="text-gray-400">Total to pay</span>
                                    <span className="text-white font-bold">₹ {party.eventId.price}</span>
                                </div>

                                <PaymentGateway
                                    eventId={party.eventId._id}
                                    slotId={party.slotId}
                                    teamId={party._id}
                                    onSuccess={() => window.location.reload()}
                                >
                                    {(handlePayment, isLoading) => (
                                        <button
                                            onClick={handlePayment}
                                            disabled={isLoading}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                                        >
                                            <CreditCard className="w-4 h-4" /> {isLoading ? 'Processing...' : 'Pay Now'}
                                        </button>
                                    )}
                                </PaymentGateway>
                            </div>
                        )}
                    </div>

                    {isLeader && party.status === 'OPEN' && (
                        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-800">
                            <p className="text-xs text-gray-400 mb-3">Leader Actions</p>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-sm transition">
                                Lock Team & Enable Payments
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

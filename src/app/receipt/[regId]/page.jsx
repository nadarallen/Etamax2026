'use client';
import { useParams } from 'next/navigation';
import ReceiptTemplate from '@/components/ReceiptTemplate';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getRegistrationReceiptAction } from '@/server-actions/registration';

export default function ReceiptPage() {
    const params = useParams();
    const [data, setData] = useState(null);
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadReceipt() {
            if (params.regId) {
                const result = await getRegistrationReceiptAction(params.regId);
                console.log("Receipt Data Result:", result);
                if (result && result.current) {
                    setData(result.current);
                    setAllRegistrations(result.all || []);
                } else {
                    console.error("No receipt found for ID:", params.regId);
                }
            }
            setLoading(false);
        }
        loadReceipt();
    }, [params.regId]);

    if (loading) return <div className="min-h-screen pt-24 text-center text-white">Generating Receipt...</div>;
    if (!data) return <div className="min-h-screen pt-24 text-center text-white">Receipt not found</div>;

    // --- Criteria Check Logic ---
    // User needs 1 Tech + 1 Cultural + 1 Seminar
    const eligibleRegs = allRegistrations;
    const categories = new Set(eligibleRegs.map(r => r.eventId?.category).filter(Boolean));
    const criteriaList = [
        { id: 'Technical', label: 'Technical' },
        { id: 'Cultural', label: 'Cultural' },
        { id: 'Seminar', label: 'Seminar' }
    ];
    const completedCount = criteriaList.filter(c => categories.has(c.id)).length;
    const isCriteriaMet = completedCount === 3;

    const isPending = data.status === 'PENDING';
    const isTeamMemberPending = isPending && data.paymentMethod === 'FREE';

    return (
        <div className="min-h-screen pt-20 px-4 pb-20 flex flex-col items-center">
            <h1 className="text-2xl text-white mb-6">
                Registration Receipt
            </h1>

            {/* Criteria Warning (if not met) */}
            {!isCriteriaMet && (
                <div className="w-full max-w-3xl mb-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-4">
                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                        <h4 className="text-yellow-400 font-bold mb-1">Participation Criteria Incomplete</h4>
                        <p className="text-gray-300 text-sm mb-2">
                            To receive your final certificate, you must register for <strong>1 Technical, 1 Cultural, and 1 Seminar</strong> event.
                        </p>
                        <div className="flex gap-2">
                            {criteriaList.map(c => {
                                const isDone = categories.has(c.id);
                                return <span key={c.id} className={`text-xs px-2 py-0.5 rounded border ${isDone ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{c.label}</span>
                            })}
                        </div>
                    </div>
                </div>
            )}


            {/* Consolidated Events Table */}
            <div className="w-full max-w-3xl bg-white p-8 mb-8 text-black shadow-xl rounded-sm">
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-2xl font-bold">AGNEL CHARITIES</h1>
                    <h2 className="text-xl font-bold text-gray-800">FR. C. RODRIGUES INSTITUTE OF TECHNOLOGY</h2>
                    <div className="flex justify-between items-end mt-4">
                        <div className="text-left text-sm">
                            <p><strong>Name:</strong> {data.fullName}</p>
                            <p><strong>Roll No:</strong> {data.rollNumber}</p>
                            <p><strong>Branch:</strong> {data.branch}</p>
                        </div>
                        <div className="text-right text-sm">
                            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            <p><strong>Master ID:</strong> {data.etamaxId}</p>
                        </div>
                    </div>
                </div>

                <h3 className="font-bold text-lg mb-4 border-b pb-2">Registered Events</h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-2 text-left">Event Name</th>
                                <th className="border border-black p-2 text-left">Category</th>
                                <th className="border border-black p-2 text-left">Slot/Time</th>
                                <th className="border border-black p-2 text-left">Team Details</th>
                                <th className="border border-black p-2 text-right">Fee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allRegistrations.map((reg, idx) => {
                                const isTeam = reg.team;
                                return (
                                    <tr key={idx}>
                                        <td className="border border-black p-2 font-medium">{reg.eventId?.name}</td>
                                        <td className="border border-black p-2">{reg.eventId?.category}</td>
                                        <td className="border border-black p-2">
                                            {reg.slotId?.dayNumber ? `Day ${reg.slotId.dayNumber}` : ''}<br />
                                            {reg.slotId?.startTime}
                                        </td>
                                        <td className="border border-black p-2">
                                            {isTeam ? (
                                                <div className="text-xs">
                                                    <strong>{reg.team.name}</strong><br />
                                                    <span className="text-gray-600">ID: {reg.team.code}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="border border-black p-2 text-right">
                                            <div className="flex flex-col items-end">
                                                <span>{reg.paymentMethod === 'FREE' ? '0' : (reg.eventId?.price > 0 ? `₹${reg.eventId.price}` : 'Free')}</span>
                                                <span className={`text-[10px] font-bold uppercase ${reg.status === 'CONFIRMED' || reg.status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {reg.status === 'CONFIRMED' ? 'PAID' : reg.status}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Total Row */}
                            <tr className="bg-gray-50 font-bold">
                                <td colSpan={4} className="border border-black p-2 text-right">Total Paid</td>
                                <td className="border border-black p-2 text-right">
                                    ₹{allRegistrations.reduce((acc, curr) => {
                                        if (curr.paymentMethod === 'FREE') return acc;
                                        return acc + (curr.eventId?.price || 0);
                                    }, 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 pt-8 border-t border-black flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        * This document is computer generated and valid only with ID card.
                    </div>
                    <div className="text-center relative">
                        <img
                            src="/planets/logo.jpeg"
                            alt="Stamp"
                            className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 object-contain opacity-50 -rotate-12 pointer-events-none"
                        />
                        <div className="h-10 w-32 border-b border-black mb-1 mx-auto relative z-10"></div>
                        <span className="text-sm font-bold relative z-10">Authorized Signatory</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 mb-12 flex flex-col md:flex-row gap-4 w-full md:w-auto px-4">
                <button
                    onClick={() => window.print()}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors w-full md:w-auto text-center font-medium"
                >
                    Print Master Receipt
                </button>
                <Link
                    href="/events"
                    className="bg-galaxy-purple hover:bg-galaxy-purple/80 text-white px-6 py-3 rounded-xl transition-colors w-full md:w-auto text-center font-medium"
                >
                    Back to Events
                </Link>
            </div>
        </div >
    );
}

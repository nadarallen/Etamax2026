'use client';
import { useParams } from 'next/navigation';
import ReceiptTemplate from '@/components/ReceiptTemplate';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getRegistrationReceiptAction } from '@/server-actions/registration';

export default function ReceiptPage() {
    const params = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadReceipt() {
            if (params.regId) {
                const reg = await getRegistrationReceiptAction(params.regId);
                console.log("Receipt Data:", reg); // Debug log in browser console
                if (reg) {
                    setData({
                        name: reg.fullName || 'N/A',
                        rollNo: reg.rollNumber || 'N/A',
                        email: reg.email || 'N/A',
                        branch: reg.branch || "Enigineering",
                        semester: reg.semester || "N/A",
                        eventName: reg.eventId?.name || 'Unknown Event',
                        eventType: reg.eventId?.type || 'N/A',
                        eventCategory: reg.eventId?.category || 'N/A',
                        amount: reg.eventId?.price > 0 ? `₹${reg.eventId.price}` : "Free",
                        transactionId: reg._id,
                        date: reg.slotId?.dayNumber ? `Day ${reg.slotId.dayNumber}` : 'Date TBD',
                        time: (reg.slotId?.startTime && reg.slotId?.endTime)
                            ? `${new Date(reg.slotId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(reg.slotId.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Time TBD',
                        venue: reg.slotId?.venue || 'Venue TBD',
                        status: reg.status || 'UNKNOWN'
                    });
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

    return (
        <div className="min-h-screen pt-20 px-4 pb-20 flex flex-col items-center">
            <h1 className="text-2xl text-white mb-6">Registration Receipt</h1>
            <ReceiptTemplate data={data} />

            <div className="mt-8 mb-12 flex flex-col md:flex-row gap-4 w-full md:w-auto px-4">
                <button
                    onClick={() => window.print()}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors w-full md:w-auto text-center font-medium"
                >
                    Print Receipt
                </button>
                <Link
                    href="/events"
                    className="bg-galaxy-purple hover:bg-galaxy-purple/80 text-white px-6 py-3 rounded-xl transition-colors w-full md:w-auto text-center font-medium"
                >
                    Back to Events
                </Link>
            </div>
        </div>
    );
}

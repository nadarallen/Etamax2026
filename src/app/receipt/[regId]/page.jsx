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
                        etamaxId: reg.etamaxId || 'N/A',
                        date: reg.slotId?.dayNumber ? `Day ${reg.slotId.dayNumber}` : 'Date TBD',
                        time: (reg.slotId?.startTime && reg.slotId?.endTime)
                            ? `${reg.slotId.startTime} - ${reg.slotId.endTime}`
                            : 'Time TBD',
                        venue: reg.slotId?.venue || 'Venue TBD',
                        status: reg.status || 'UNKNOWN',
                        registrationDate: reg.createdAt || null
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

    // If pending, we still want to show the receipt so they can show it to the desk,
    // but with a clear "PENDING" functionality.
    const isPending = data.status === 'PENDING';

    return (
        <div className="min-h-screen pt-20 px-4 pb-20 flex flex-col items-center">
            <h1 className="text-2xl text-white mb-6">
                {isPending ? 'Payment Pending' : 'Registration Receipt'}
            </h1>

            {isPending && (
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-center max-w-md">
                    <p className="text-yellow-400 font-bold mb-2">Private & Confidential</p>
                    <p className="text-gray-300 text-sm">
                        Please show this receipt at the <strong>Offline Registration Desk</strong> to complete your payment.
                    </p>
                </div>
            )}

            <ReceiptTemplate data={data} watermark={isPending ? "PAYMENT PENDING" : null} />

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

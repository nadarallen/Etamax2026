'use client';
import { useParams } from 'next/navigation';
import ReceiptTemplate from '@/components/ReceiptTemplate';
import Link from 'next/link';

export default function ReceiptPage() {
    const params = useParams();

    // In a real app, we would fetch receipt data using params.regId
    // Here we just show a placeholder or explain
    const startData = {
        name: "Student Name",
        rollNo: "123456",
        branch: "Computer",
        eventName: "Event Name",
        eventType: "Solo",
        amount: "0",
        transactionId: params.regId
    };

    return (
        <div className="min-h-screen pt-20 px-4 flex flex-col items-center">
            <h1 className="text-2xl text-white mb-6">Receipt Preview</h1>
            <ReceiptTemplate data={startData} />

            <div className="mt-8">
                <Link href="/events" className="text-galaxy-accent hover:text-white underline">
                    Return to Home
                </Link>
            </div>
        </div>
    );
}

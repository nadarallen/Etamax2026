import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import Registration from '@/models/Registration';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

export default async function ReceiptPage({ params }: { params: { id: string } }) {
    await connectToDatabase();

    // Prompt 21: Receipt Generation
    const reg = await Registration.findOne({ qrCodeHash: params.id }) // Using hash as public ID? Or just local ID?
        // Let's assume params.id is the _id for simplicity, but in prod we use hash to prevent scraping
        .populate('userId')
        .populate('eventId')
        .populate('paymentId');

    // Fallback to searching by _id if hash fails (for development convenience)
    const registration = reg || await Registration.findById(params.id)
        .populate('userId')
        .populate('eventId')
        .populate('paymentId');

    if (!registration) notFound();

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-gray-200">
                <div className="text-center border-b border-gray-100 pb-6 mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Registration Confirmed</h1>
                    <p className="text-gray-500 text-sm mt-1">Etamax 2025</p>
                    <div className="mt-4 inline-block bg-gray-900 text-white px-4 py-1 rounded-full text-xs font-mono tracking-widest">
                        #{registration._id.toString().substring(0, 8).toUpperCase()}
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Attendee</span>
                        <span className="font-bold text-gray-900">{(registration.userId as any).name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Event</span>
                        <span className="font-bold text-gray-900">{(registration.eventId as any).title}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Amount Paid</span>
                        <span className="font-bold text-gray-900">{formatCurrency((registration.paymentId as any).amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Date</span>
                        <span className="font-bold text-gray-900">{new Date(registration.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                    {/* QR Code Placeholder */}
                    <div className="w-48 h-48 bg-white mx-auto mb-2 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                        QR CODE GENERATED HERE
                    </div>
                    <p className="text-xs text-gray-400">Scan at the venue entrance</p>
                </div>

                <div className="mt-8 text-center">
                    <button
                        // onClick="window.print()" // Needs Client Component or just instruction
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Download / Print
                    </button>
                </div>
            </div>
        </div>
    );
}

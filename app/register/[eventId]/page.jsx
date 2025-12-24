'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import eventsData from '@/data/events.json';
import RegistrationForm from '@/components/RegistrationForm';
import RazorpayButton from '@/components/RazorpayButton';
import { generateReceipt } from '@/utils/pdfGenerator';
import Link from 'next/link';

export default function RegisterPage() {
    const params = useParams();
    const router = useRouter();
    const event = eventsData.find(e => e.id === params.eventId);

    const [step, setStep] = useState('form'); // form | payment | success
    const [formData, setFormData] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    if (!event) return <div className="text-white p-10">Event not found</div>;

    const handleFormSubmit = (data) => {
        setFormData(data);
        setShowPaymentModal(true);
    };

    const handleOfflinePayment = async () => {
        // Generate Receipt immediately
        const finalData = {
            ...formData,
            eventName: event.name,
            eventType: event.type,
            amount: event.price,
            transactionId: 'CASH-' + Date.now(),
            status: 'Pending Verification at Counter'
        };

        await completeRegistration(finalData);
    };

    const handleOnlineSuccess = async (paymentData) => {
        // paymentData comes from RazorpayButton handler
        const finalData = {
            ...formData,
            eventName: event.name,
            eventType: event.type,
            amount: event.price,
            transactionId: paymentData.transactionId,
            status: 'Paid Online'
        };
        await completeRegistration(finalData);
    };

    const completeRegistration = async (data) => {
        // Save to backend
        await fetch('/api/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Generate PDF
        generateReceipt(data);

        setReceiptData(data);
        setShowPaymentModal(false);
        setStep('success');
    };

    return (
        <div className="min-h-screen pt-20 px-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-white mb-8 text-center">
                Register for <span className="text-galaxy-accent">{event.name}</span>
            </h1>

            {step === 'form' && (
                <div className="relative">
                    <RegistrationForm event={event} onSubmit={handleFormSubmit} />

                    {/* Payment Modal Overlay */}
                    {showPaymentModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <div className="bg-galaxy-dark border border-white/10 rounded-2xl w-full max-w-md p-6">
                                <h3 className="text-xl font-bold text-white mb-4 text-center">Choose Payment Mode</h3>
                                <p className="text-gray-400 text-center mb-6">Amount to Pay: ₹{event.price}</p>

                                <div className="space-y-4">
                                    <RazorpayButton
                                        amount={event.price}
                                        userDetails={formData}
                                        eventDetails={{ name: event.name, type: event.type }}
                                        onSuccess={handleOnlineSuccess}
                                    />

                                    <button
                                        onClick={handleOfflinePayment}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
                                    >
                                        Pay Offline (Generate Receipt)
                                    </button>

                                    <button
                                        onClick={() => setShowPaymentModal(false)}
                                        className="w-full py-2 text-sm text-gray-400 hover:text-white mt-2"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'success' && (
                <div className="text-center bg-white/5 p-8 rounded-2xl border border-galaxy-accent/30 animate-in fade-in zoom-in duration-500">
                    <div className="inline-block p-4 rounded-full bg-green-500/20 text-green-400 mb-4 text-4xl">✓</div>
                    <h2 className="text-3xl font-bold text-white mb-2">Registration Successful!</h2>
                    <p className="text-gray-300 mb-6">
                        Your receipt for <strong>{receiptData.transactionId}</strong> has been downloaded.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => generateReceipt(receiptData)} className="btn-primary bg-galaxy-purple">
                            Download Receipt Again
                        </button>
                        <Link href="/events">
                            <button className="px-6 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10">
                                Back to Events
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

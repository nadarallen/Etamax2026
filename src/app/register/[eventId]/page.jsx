'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RegistrationForm from '@/components/RegistrationForm';
import RazorpayButton from '@/components/RazorpayButton';
import { getSlotsAction } from '@/server-actions/events';
import { generateReceipt } from '@/utils/pdfGenerator';
import Link from 'next/link';

export default function RegisterPage() {
    const params = useParams();
    const router = useRouter();

    // Fetch Event from API instead of JSON
    const [event, setEvent] = useState(null);
    const [slots, setSlots] = useState([]); // Add slots state
    const [loading, setLoading] = useState(true);

    const [step, setStep] = useState('form'); // form | payment | success
    const [formData, setFormData] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${params.eventId}`);
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);
                    // Fetch Slots
                    const s = await getSlotsAction(data._id);
                    setSlots(s);
                    setEvent({ ...data, slots: s });
                } else {
                    setEvent(null);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [params.eventId]);

    if (loading) return <div className="text-white p-10 text-center pt-24">Loading Event Details...</div>;
    if (!event) return <div className="text-white p-10 text-center pt-24">Event not found. It might have been deleted or invalid ID.</div>;

    const handleFormSubmit = (data) => {
        setFormData(data);
        if (event.eventType === 'SOLO') {
            setShowPaymentModal(true);
        } else {
            // For Teams, we create the team first (Offline/Pending mode)
            // Use setTimeout to ensure state update or passed data
            handleOfflinePayment(data);
        }
    };

    const handleOfflinePayment = async (dataOverride = null) => {
        const dataToUse = dataOverride || formData;
        if (!dataToUse) return;

        try {
            // Import dynamically 
            const { registerForEventAction } = await import('@/server-actions/registration');

            const formDataObj = new FormData();
            Object.entries(dataToUse).forEach(([k, v]) => {
                if (!Array.isArray(v)) {
                    formDataObj.append(k, v);
                }
            });
            formDataObj.append('eventId', event._id);
            formDataObj.append('paymentMethod', event.eventType === 'SOLO' ? 'ONLINE' : 'OFFLINE');
            formDataObj.append('teamAction', event.eventType !== 'SOLO' ? 'CREATE' : 'NONE');

            const result = await registerForEventAction(null, formDataObj);

            if (result.error) throw new Error(result.error);

            const finalData = {
                ...dataToUse,
                eventName: event.title,
                eventType: event.eventType,
                amount: event.price,
                transactionId: result.registrationId,
                status: 'Team Created (Pending)',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                slot: event.slots?.find(s => s._id === dataToUse.slotId)
            };

            generateReceipt(finalData);
            setReceiptData(finalData);
            setShowPaymentModal(false);
            setStep('success');

        } catch (error) {
            console.error(error);
            alert(error.message || 'Registration Failed');
        }
    };

    const handleOnlineSuccess = async (paymentData) => {
        // Payment verified by RazorpayButton -> Verify API -> onSuccess
        // paymentData contains registrationId etc.
        const slot = event.slots?.find(s => s._id === formData.slotId);

        const finalReceiptData = {
            ...paymentData,
            status: 'Paid Online',
            transactionId: paymentData.transactionId,
            slot
        };

        setReceiptData(finalReceiptData);

        // Generate PDF
        generateReceipt({
            ...finalReceiptData,
            eventName: event.title,
            eventType: event.eventType
        });

        setShowPaymentModal(false);
        setStep('success');
    };

    return (
        <div className="min-h-screen pt-20 px-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-white mb-8 text-center">
                Register for <span className="text-galaxy-accent">{event.title}</span>
            </h1>

            {step === 'form' && (
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
                    <RegistrationForm event={event} onSubmit={handleFormSubmit} />

                    {/* Payment Modal Overlay */}
                    {showPaymentModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                            <div className="bg-black border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative z-50">
                                <h3 className="text-xl font-bold text-white mb-4 text-center">Choose Payment Mode</h3>
                                <p className="text-gray-400 text-center mb-6">Amount to Pay: ₹{event.price}</p>

                                <div className="space-y-4">
                                    <RazorpayButton
                                        amount={event.price}
                                        userDetails={formData}
                                        eventDetails={{ id: event._id, name: event.title, type: event.eventType, slotId: formData.slotId }}
                                        onSuccess={handleOnlineSuccess}
                                    />

                                    <button
                                        onClick={handleOfflinePayment}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all border border-white/5"
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
                        Your receipt for <strong>{receiptData?.transactionId}</strong> has been downloaded.
                    </p>
                    {receiptData?.status === 'Amount Pending (Pay at Desk)' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6">
                            <p className="text-yellow-400 text-sm">
                                Please show this receipt at the registration desk within 2 hours to confirm your slot.
                            </p>
                        </div>
                    )}
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => generateReceipt(receiptData)} className="btn-primary bg-galaxy-purple px-6 py-2 rounded-lg text-white">
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

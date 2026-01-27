'use client';
import { useState } from 'react';
import { loadRazorpay } from '@/utils/razorpay';
import { Loader2, CreditCard } from 'lucide-react';

export default function RazorpayButton({ amount, onSuccess, userDetails, eventDetails, className }) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);

        // 1. Load Script
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
            alert('Razorpay SDK failed to load');
            setIsLoading(false);
            return;
        }

        // 2. Create Order
        const res = await fetch('/api/payments/razorpay/create-order', {
            method: 'POST',
            body: JSON.stringify({
                eventId: eventDetails.id, // Using 'id' from props (which should be _id)
                slotId: eventDetails.slotId, // Need to pass slotId prop
                teamId: userDetails.teamId,
                amount
            }),
        });
        const order = await res.json();

        if (!res.ok) {
            alert('Order Creation Failed');
            setIsLoading(false);
            return;
        }

        // 3. Open Razorpay
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
            amount: order.amount,
            currency: order.currency,
            name: 'ETAMAX 2026',
            description: `Payment for ${eventDetails.name}`,
            order_id: order.id,
            handler: async function (response) {
                // Verify Payment
                const verifyRes = await fetch('/api/payments/razorpay/verify', {
                    method: 'POST',
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        eventId: eventDetails.id,
                        slotId: eventDetails.slotId,
                        teamId: userDetails.teamId
                    })
                });

                if (verifyRes.ok) {
                    const data = await verifyRes.json();
                    onSuccess({
                        ...userDetails,
                        ...eventDetails,
                        transactionId: response.razorpay_payment_id,
                        amount: amount,
                        registrationId: data.registrationId
                    });
                } else {
                    alert('Payment Verification Failed');
                }
            },
            prefill: {
                name: userDetails.name,
                email: userDetails.email,
                contact: userDetails.phone,
            },
            theme: {
                color: '#6d28d9',
            },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        setIsLoading(false);
    };

    return (
        <button
            onClick={handlePayment}
            disabled={isLoading}
            className={`group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-px shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${className || ''}`}
        >
            <div className="relative flex items-center justify-center gap-2 bg-black/20 backdrop-blur-sm py-3.5 rounded-xl transition-all group-hover:bg-transparent">
                {isLoading ? (
                    <Loader2 className="animate-spin text-white" />
                ) : (
                    <>
                        <CreditCard size={18} className="text-white" />
                        <span className="font-bold text-white tracking-wide">Pay Online</span>
                    </>
                )}
            </div>
        </button>
    );
}

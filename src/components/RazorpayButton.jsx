'use client';
import { useState } from 'react';
import { loadRazorpay } from '@/utils/razorpay';
import { Loader2 } from 'lucide-react';

export default function RazorpayButton({ amount, onSuccess, userDetails, eventDetails }) {
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

        // 2. Create Order (Mock API)
        const res = await fetch('/api/razorpay', {
            method: 'POST',
            body: JSON.stringify({ amount }),
        });
        const order = await res.json();

        // 3. Open Razorpay
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890', // User to replace
            amount: order.amount,
            currency: order.currency,
            name: 'ETAMAX 2026',
            description: `Payment for ${eventDetails.name}`,
            order_id: order.id,
            handler: async function (response) {
                // Success
                onSuccess({
                    ...userDetails,
                    ...eventDetails,
                    transactionId: response.razorpay_payment_id || 'PAY-' + Date.now(),
                    amount: amount
                });
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
            className="flex items-center justify-center w-full py-3 bg-galaxy-purple hover:bg-galaxy-accent text-white rounded-lg font-bold transition-all"
        >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Pay Online (Razorpay)'}
        </button>
    );
}

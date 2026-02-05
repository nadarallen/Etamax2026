import { useState } from 'react';

const loadRazorpay = () => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function useRazorpay() {
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * @param {Object} params
     * @param {string[]} [params.registrationIds] - For bulk payment (Confirmation Page)
     * @param {string} [params.eventId] - For single payment (Legacy/Direct)
     * @param {string} [params.slotId]
     * @param {Object} params.eventDetails - For display (name, description)
     * @param {Object} params.userDetails - For prefill (name, email, phone)
     * @param {number} params.amount - Total amount
     * @param {Function} params.onSuccess
     * @param {Function} params.onError
     */
    const processPayment = async ({
        registrationIds,
        eventId,
        slotId,
        teamId,
        bypassCode,
        eventDetails,
        userDetails,
        amount,
        onSuccess,
        onError
    }) => {
        setIsProcessing(true);
        try {
            // 1. Load SDK
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                throw new Error('Razorpay SDK failed to load');
            }

            // 2. Create Order
            // Decide payload based on mode
            const payload = registrationIds ? {
                registrationIds,
                amount,
                bypassCode // Add bypassCode for bulk payments
            } : {
                eventId,
                slotId,
                teamId,
                bypassCode, // Add bypassCode for single payments
                amount
            };

            const res = await fetch('/api/payments/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Order Creation Failed');
            }
            const order = await res.json();

            // 3. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'ETAMAX 2026',
                description: eventDetails.name || 'Event Registration',
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            // Send legacy params if single, or nothing extra for bulk (backend checks metadata)
                            eventId,
                            slotId,
                            teamId
                        };

                        const verifyRes = await fetch('/api/payments/razorpay/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(verifyPayload)
                        });

                        if (verifyRes.ok) {
                            const data = await verifyRes.json();
                            if (onSuccess) onSuccess(data);
                        } else {
                            throw new Error('Payment Verification Failed');
                        }
                    } catch (err) {
                        if (onError) onError(err);
                        else alert(err.message);
                    }
                },
                prefill: {
                    name: userDetails?.fullName || userDetails?.name,
                    email: userDetails?.email,
                    contact: userDetails?.phone,
                },
                theme: {
                    color: '#6d28d9',
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            setIsProcessing(false);
            if (onError) onError(err);
            else console.error(err);
        }
    };

    return { processPayment, isProcessing };
}

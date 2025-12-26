'use client';

import { useState } from 'react';
import Script from 'next/script';
import { initiatePaymentAction, simulateMockPaymentAction } from '@/server-actions/payment';

declare global {
    interface Window {
        Razorpay: any;
    }
}

type PaymentGatewayProps = {
    eventId: string;
    slotId: string;
    teamId?: string;
    onSuccess?: () => void;
    children: (handlePayment: () => void, isLoading: boolean) => React.ReactNode;
};

export default function PaymentGateway({ eventId, slotId, teamId, onSuccess, children }: PaymentGatewayProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // 1. Create Order
            const result = await initiatePaymentAction(eventId, slotId, teamId);

            if (result.error || !result.success) {
                alert(result.error);
                setIsLoading(false);
                return;
            }

            // 2. Mock Mode Check
            if (result.isMock) {
                const proceed = confirm(`[DEV MODE] Simulate successful payment for ₹${result.amount / 100}?`);
                if (proceed) {
                    await simulateMockPaymentAction(result.orderId);
                    alert("Mock Payment Successful!");
                    if (onSuccess) onSuccess();
                }
                setIsLoading(false);
                return;
            }

            // 3. Open Razorpay
            const options = {
                key: result.key,
                amount: result.amount,
                currency: "INR",
                name: "Etamax 2025",
                description: "Event Registration",
                order_id: result.orderId,
                handler: function (response: any) {
                    // Verify automatically handled by Webhook, but UI can optimistically update
                    alert("Payment Successful! Receipt ID: " + response.razorpay_payment_id);
                    if (onSuccess) onSuccess();
                },
                prefill: {
                    // In real app, prefill user details from session
                    name: "Student Name",
                    email: "student@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />
            {children(handlePayment, isLoading)}
        </>
    );
}

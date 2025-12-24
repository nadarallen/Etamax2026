import { NextResponse } from 'next/server';

export async function POST(request) {
    const { amount } = await request.json();
    // Mock Razorpay Order Creation
    const orderId = 'order_' + Math.random().toString(36).substring(7);
    return NextResponse.json({
        id: orderId,
        currency: 'INR',
        amount: amount * 100 // paise
    });
}

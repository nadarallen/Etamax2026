import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();
    // Mock saving to database
    console.log('Registered User:', body);
    return NextResponse.json({ success: true, message: 'Registration Successful', regId: 'REG-' + Date.now() });
}

import { NextResponse } from 'next/server';

// This could be used to fetch receipt data securely
export async function GET(request) {
    return NextResponse.json({ message: 'Receipt Endpoint' });
}

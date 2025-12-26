import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Payment, { PaymentStatus } from '@/models/Payment';
import { getSession, Role } from '@/lib/auth';

export async function GET(req: NextRequest) {
    // 1. Security Check
    const session = await getSession();
    if (session?.role !== Role.SUPER_ADMIN && session?.role !== Role.CLUB_ADMIN) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    // 2. Fetch Data (Streamable logic would use Cursor, for demo we load memory)
    // Prompt 25: CSV Format
    const payments = await Payment.find({ status: PaymentStatus.SUCCESS })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

    // 3. Generate CSV
    const csvRows = [];
    // Headers
    csvRows.push(['Payment ID', 'User Name', 'Email', 'Amount (INR)', 'Event ID', 'Date'].join(','));

    // Rows
    payments.forEach(p => {
        csvRows.push([
            p.gatewayPaymentId || p._id,
            (p.userId as any).name,
            (p.userId as any).email,
            p.amount, // stored in Rupees
            p.metadata.eventId,
            new Date(p.createdAt).toISOString()
        ].map(field => `"${field}"`).join(','));
    });

    const csvString = csvRows.join('\n');

    // 4. Return Response with Headers
    return new NextResponse(csvString, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="finance-report-${Date.now()}.csv"`,
        }
    });
}

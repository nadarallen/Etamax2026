import connectToDatabase from '@/lib/db';
import Payment, { PaymentStatus } from '@/models/Payment';
import { formatCurrency } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { approvePaymentAction, rejectPaymentAction } from '@/server-actions/admin'; // To implement

export default async function ApprovalsPage() {
    await connectToDatabase();

    // Actually finding pending payments. 
    // Note: In our seed/models we used PENDING_VERIFICATION for offline.
    const pendingPayments = await Payment.find({ status: 'PENDING_VERIFICATION' })
        .populate('userId', 'name email')
        .sort({ createdAt: 1 });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Pending Approvals</h2>
                <p className="text-gray-400">Verify offline cash payments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendingPayments.map((p: any) => (
                    <div key={p._id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-white font-bold text-lg">{p.userId.name}</p>
                                <p className="text-xs text-gray-500">{p.userId.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-green-400">{formatCurrency(p.amount)}</p>
                                <p className="text-xs text-gray-500 uppercase">{p.method}</p>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 mb-6">
                            <p><span className="text-gray-500">Event ID:</span> <span className="font-mono">{p.metadata.eventId}</span></p>
                            <p><span className="text-gray-500">Ref ID:</span> <span className="font-mono text-white">{p.referenceId || 'N/A'}</span></p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form action={rejectPaymentAction}>
                                <input type="hidden" name="paymentId" value={p._id.toString()} />
                                <button className="w-full flex items-center justify-center py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition font-semibold">
                                    <X className="w-4 h-4 mr-2" /> Reject
                                </button>
                            </form>
                            <form action={approvePaymentAction}>
                                <input type="hidden" name="paymentId" value={p._id.toString()} />
                                <button className="w-full flex items-center justify-center py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition font-semibold">
                                    <Check className="w-4 h-4 mr-2" /> Approve
                                </button>
                            </form>
                        </div>
                    </div>
                ))}

                {pendingPayments.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                        <p>No pending approvals found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

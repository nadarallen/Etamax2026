import Link from 'next/link';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import Payment, { PaymentStatus } from '@/models/Payment';
import User, { UserRole } from '@/models/User';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Users, Calendar, AlertCircle } from 'lucide-react';

export default async function AdminDashboard() {
    await connectToDatabase();

    // 1. Aggregate Stats
    const totalRevenue = await Payment.aggregate([
        { $match: { status: PaymentStatus.SUCCESS } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalUsers = await User.countDocuments({ role: UserRole.STUDENT });
    const totalEvents = await Event.countDocuments({ isPublished: true });

    // Pending Offline approvals
    const pendingApprovals = await Payment.countDocuments({ status: "PENDING_VERIFICATION" }); // Assuming we have this status for offline

    // Recent Sales
    const recentSales = await Payment.find({ status: PaymentStatus.SUCCESS })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email');

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Master Overview</h2>
                <p className="text-gray-400 mt-1">System wide metrics and actions.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard
                    label="Total Revenue"
                    value={formatCurrency(totalRevenue[0]?.total || 0)}
                    icon={<TrendingUp className="text-green-500" />}
                    trend="+12% today"
                />
                <AdminStatCard
                    label="Registered Students"
                    value={totalUsers.toString()}
                    icon={<Users className="text-blue-500" />}
                />
                <AdminStatCard
                    label="Active Events"
                    value={totalEvents.toString()}
                    icon={<Calendar className="text-purple-500" />}
                />
                <AdminStatCard
                    label="Pending Approvals"
                    value={pendingApprovals.toString()}
                    icon={<AlertCircle className="text-yellow-500" />}
                    highlight={pendingApprovals > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Sales Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800">
                        <h3 className="font-bold text-white">Recent Transactions</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-gray-800 text-gray-200 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {recentSales.map((sale: any) => (
                                    <tr key={sale._id} className="hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-white">{sale.userId.name}</td>
                                        <td className="px-6 py-4">{formatCurrency(sale.amount)}</td>
                                        <td className="px-6 py-4">{new Date(sale.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-green-400">{sale.status}</td>
                                    </tr>
                                ))}
                                {recentSales.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center">No sales yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Action Shortcuts */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 rounded-xl p-6 border border-white/10 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white mb-2">Offline Approvals</h3>
                            <p className="text-indigo-200 text-sm mb-4">Validate cash payments and confirm slots manually.</p>
                            <Link href="/admin/approvals" className="inline-block bg-white text-indigo-900 font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                                Process Queue ({pendingApprovals})
                            </Link>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="font-bold text-white mb-4">Reports & Exports</h3>
                        <div className="space-y-2">
                            <button className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition flex items-center justify-between group">
                                Download Finance Report (CSV) <span className="opacity-0 group-hover:opacity-100 transition">↓</span>
                            </button>
                            <button className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition flex items-center justify-between group">
                                Download Slot Manifest <span className="opacity-0 group-hover:opacity-100 transition">↓</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminStatCard({ label, value, icon, trend, highlight }: any) {
    return (
        <div className={`p-6 rounded-xl border ${highlight ? 'bg-yellow-900/10 border-yellow-500/50' : 'bg-gray-900 border-gray-800'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-800 rounded-lg">{icon}</div>
                {trend && <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">{trend}</span>}
            </div>
            <p className="text-gray-400 text-sm">{label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
    );
}

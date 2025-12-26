import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Team from '@/models/Team';
import Link from 'next/link';
import { ArrowRight, Shield, LogOut } from 'lucide-react';
import { leavePartyAction } from '@/server-actions/party';

async function getMyTeams() {
    const session = await getSession();
    if (!session) return [];
    await connectToDatabase();

    // Fetch teams where user is a member
    const teams = await Team.find({ "members.userId": session.userId })
        .populate('eventId')
        .sort({ createdAt: -1 })
        .lean();

    return JSON.parse(JSON.stringify(teams));
}

function LeaveTeamButton({ partyId }: { partyId: string }) {
    return (
        <form action={async () => {
            'use server';
            await leavePartyAction(partyId);
        }}>
            <button className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1 transition">
                <LogOut className="w-3 h-3" /> Leave
            </button>
        </form>
    );
}

export default async function MyTeamsPage() {
    const session = await getSession();
    const teams = await getMyTeams();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">My Teams</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((team: any) => {
                    const myMemberInfo = team.members.find((m: any) => m.userId.toString() === session?.userId);
                    const isPaid = myMemberInfo?.paymentStatus === 'PAID';

                    return (
                        <div key={team._id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-900/50 transition">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                                    <p className="text-sm text-gray-400">{team.eventId?.title}</p>
                                </div>
                                {isPaid ? (
                                    <span className="bg-green-900/20 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-900/30">
                                        CONFIRMED
                                    </span>
                                ) : (
                                    <span className="bg-yellow-900/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded border border-yellow-900/30">
                                        PENDING
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <Link href={`/student/party/${team._id}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center group">
                                    View Dashboard <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition" />
                                </Link>

                                {!isPaid && team.leaderId !== session?.userId && (
                                    <LeaveTeamButton partyId={team._id} />
                                )}
                            </div>
                        </div>
                    );
                })}

                {teams.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-gray-900/50 rounded-xl border-dashed border-2 border-gray-800">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>You haven't joined any teams yet.</p>
                        <Link href="/student" className="text-blue-500 mt-2 inline-block hover:underline">Browse Events</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

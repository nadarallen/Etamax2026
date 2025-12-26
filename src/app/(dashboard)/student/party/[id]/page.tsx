import { notFound } from 'next/navigation';
import { getPartyDetails } from '@/server-actions/party';
import { PartyDashboardClient } from '@/components/features/PartyDashboardClient';
import { getSession } from '@/lib/auth';

export default async function PartyPage({ params }: { params: { id: string } }) {
    const party = await getPartyDetails(params.id);
    const session = await getSession();

    if (!party || !session) notFound();

    return <PartyDashboardClient initialParty={party} currentUserId={session.userId as string} />;
}

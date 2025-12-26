import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { getSession } from '@/lib/auth';
import { ClubSlotManager } from '@/components/features/ClubSlotManager';

export default async function ClubEventManager({ params }: { params: { id: string } }) {
    await connectToDatabase();
    const session = await getSession();

    const event = await Event.findOne({ _id: params.id, clubId: session?.userId }).lean(); // Security Check
    if (!event) notFound();

    // Serialize IDs for Client Component
    const serializedEvent = JSON.parse(JSON.stringify(event));

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{event.title}: Slot Management</h1>
                <p className="text-gray-400">Click on a slot to view detailed manifest or block it.</p>
            </div>

            <ClubSlotManager event={serializedEvent} />
        </div>
    );
}

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import AddSlotForm from '@/components/admin/AddSlotForm';
import { getSession, Role } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SlotManagementPage({ params }) {
    const { id } = await params;

    // Auth Check
    const session = await getSession();
    if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
        redirect('/login');
    }

    await connectToDatabase();
    const event = await Event.findById(id).lean();
    if (!event) return <div className="text-white">Event not found</div>;

    // Serialize slots because Dates can't be passed to client components easily (though this is SC to SC mostly)
    // but good practice to inspect.

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-4xl mx-auto text-white">
            <Link href="/admin" className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>

            <h1 className="text-3xl font-display font-bold mb-2">Manage Slots: <span className="text-galaxy-purple">{event.title}</span></h1>
            <p className="text-gray-400 mb-8">Add or remove time slots for this event.</p>

            {/* Add Slot Form (Client Component) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-12">
                <h2 className="text-xl font-bold mb-6">Add New Slot</h2>
                <AddSlotForm eventId={id} />
            </div>

            {/* Existing Slots List */}
            <div>
                <h2 className="text-xl font-bold mb-6">Existing Slots ({event.slots?.length || 0})</h2>
                {event.slots && event.slots.length > 0 ? (
                    <div className="grid gap-4">
                        {event.slots.map((slot) => (
                            <div key={slot._id.toString()} className="bg-white/5 border border-white/10 rounded-xl p-6 flex justify-between items-center">
                                <div>
                                    <p className="text-galaxy-purple font-bold">
                                        {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleTimeString()}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Capacity: {slot.bookedCount} / {slot.capacity} booked
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${slot.bookedCount >= slot.capacity ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {slot.bookedCount >= slot.capacity ? 'FULL' : 'OPEN'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-500">
                        No slots added yet.
                    </div>
                )}
            </div>
        </div>
    );
}

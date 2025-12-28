'use client';

import { useActionState } from 'react';
import { addSlotAction } from '@/server-actions/slot';

const initialState = { error: '' };

export default function AddSlotForm({ eventId }) {
    const [state, formAction, isPending] = useActionState(addSlotAction, initialState);

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="eventId" value={eventId} />

            {state?.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {state.error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Start Time</label>
                    <input type="datetime-local" name="startTime" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1 ml-1">End Time</label>
                    <input type="datetime-local" name="endTime" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" />
                </div>
                <div className="col-span-1">
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Capacity</label>
                    <input type="number" name="capacity" defaultValue="30" min="1" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" />
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="bg-galaxy-purple hover:bg-galaxy-purple/90 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
                {isPending ? 'Adding Slot...' : 'Add Slot'}
            </button>
        </form>
    );
}

'use client';

import { useActionState, useState } from 'react';
import { createEventAction } from '@/server-actions/event';
import { X } from 'lucide-react';

const initialState = { error: '' };

export default function CreateEventModal({ onClose }) {
    const [state, formAction, isPending] = useActionState(createEventAction, initialState);
    const [eventType, setEventType] = useState('SOLO');

    // ...

    return (
        // ... (wrapper)
        <form action={formAction} className="p-6 space-y-6">
            {/* ... (Error) */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Event Title</label>
                    <input name="name" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="e.g. Robo War" />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Club Name</label>
                    <input name="club" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="e.g. Robo Club" />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Category</label>
                    <input name="category" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="e.g. Technical" />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Description</label>
                    <textarea name="description" rows={3} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="Event details..." />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Event Type</label>
                    <select
                        name="type"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none"
                    >
                        <option value="solo">Solo</option>
                        <option value="duo">Duo</option>
                        <option value="group">Group</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Price (₹)</label>
                    <input type="number" name="price" required min="0" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="0" />
                </div>

                <div className="col-span-2">
                     <label className="block text-sm text-gray-400 mb-1 ml-1">WhatsApp Group Link (Optional)</label>
                     <input type="url" name="whatsappLink" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="https://chat.whatsapp.com/..." />
                </div>


                {/* capacity field matching 'maxMembers' in DB */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1 ml-1">
                        {eventType === 'solo' ? 'Total Capacity (Participants)' : 'Total Capacity (Teams)'}
                    </label>
                    <input type="number" name="maxMembers" required min="1" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="Limit" />
                </div>

                {/* Optional Team Size controls - only if not solo? Or keep for all? */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1 ml-1">Min Team Size</label>
                    <input type="number" name="minTeamSize" defaultValue="1" min="1" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" />
                </div>

                {/* 
                            Note: Previous createEventAction expects 'maxMembers' but maybe not min/max team size in the schema?
                            Wait, schema had `id`, `name`, `type`... `maxMembers`.
                            It did NOT have `minTeamSize`.
                            So minTeamSize/maxTeamSize inputs might be unused unless I update schema.
                            But user specific request was about 'how many teams'.
                            I have added 'maxMembers' input above which maps to DB capacity.
                        */}
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-gray-400 hover:text-white transition-colors">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-galaxy-purple hover:bg-galaxy-purple/90 text-white px-8 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                    {isPending ? 'Creating...' : 'Create Event'}
                </button>
            </div>
        </form>
            </div >
        </div >
    );
}

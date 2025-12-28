'use client';

import { useActionState, useState } from 'react';
import { createEventAction } from '@/server-actions/event';
import { X } from 'lucide-react';

const initialState = { error: '' };

export default function CreateEventModal({ onClose }) {
    const [state, formAction, isPending] = useActionState(createEventAction, initialState);
    // For manual close on success, or use router logic inside action

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Create New Event</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form action={formAction} className="p-6 space-y-6">
                    {state?.error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {state.error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Event Title</label>
                            <input name="title" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="e.g. Robo War" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Description</label>
                            <textarea name="description" rows={3} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="Event details..." />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Event Type</label>
                            <select name="eventType" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none">
                                <option value="SOLO">Solo</option>
                                <option value="TEAM">Team</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Price (₹)</label>
                            <input type="number" name="price" required min="0" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" placeholder="0" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Min Team Size</label>
                            <input type="number" name="minTeamSize" defaultValue="1" min="1" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Max Team Size</label>
                            <input type="number" name="maxTeamSize" defaultValue="1" min="1" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:outline-none" />
                        </div>
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
            </div>
        </div>
    );
}

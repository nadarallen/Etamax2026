'use client';

import { useFormState } from 'react-dom';
import { createEventAction } from '@/server-actions/club';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const initialState = {
    error: '',
    fieldErrors: {} as Record<string, string[]>
};

export default function CreateEventForm() {
    const [state, action] = useFormState(createEventAction, initialState);
    const router = useRouter();

    useEffect(() => {
        if ((state as any)?.success) {
            router.push('/club');
            router.refresh();
        }
    }, [state, router]);

    return (
        <form action={action} className="space-y-6 max-w-2xl mx-auto bg-gray-900 p-8 rounded-xl border border-gray-800">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                <input name="title" required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Hackathon 2025" />
                {state?.fieldErrors?.title && <p className="text-red-400 text-xs mt-1">{state.fieldErrors.title[0]}</p>}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea name="description" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Short description of the event..." />
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
                    <select name="eventType" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="SOLO">Solo Event</option>
                        <option value="TEAM">Team Event</option>
                    </select>
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹)</label>
                    <input name="price" type="number" min="0" required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Team Size Limits (Conditional in logic, but simpler to show all for now) */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Min Team Size</label>
                    <input name="minTeamSize" type="number" min="1" defaultValue="1" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Team Size</label>
                    <input name="maxTeamSize" type="number" min="1" defaultValue="1" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
            </div>

            {state?.error && (
                <div className="bg-red-900/20 border border-red-900/50 p-3 rounded text-red-500 text-sm">
                    {state.error}
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition">
                    Create Draft Event
                </button>
            </div>
        </form>
    );
}

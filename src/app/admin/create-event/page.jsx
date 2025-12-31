'use client';

import { useActionState } from 'react';
import { createEventAction } from '@/server-actions/events';

const initialState = {
    error: '',
    success: false
};

export default function CreateEventPage() {
    const [state, formAction, isPending] = useActionState(createEventAction, initialState);

    // Simple success message or redirect could be added here
    if (state?.success) {
        return (
            <div className="min-h-screen bg-galaxy-dark text-white flex items-center justify-center p-4">
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-8 rounded-2xl text-center">
                    <h1 className="text-3xl font-bold mb-4">Event Created!</h1>
                    <p>Your event has been successfully added to the database.</p>
                    <a href="/events" className="inline-block mt-6 px-6 py-2 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition">
                        View Events
                    </a>
                    <a href="/admin/create-event" className="block mt-4 text-green-400 hover:text-white text-sm">Create Another</a>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-galaxy-dark text-white pt-24 px-4 pb-20">


            <div className="relative z-10 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-galaxy-purple">
                    Create New Event
                </h1>

                <form action={formAction} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl space-y-6">
                    {state?.error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                            {state.error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-galaxy-purple">Basic Info</h3>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Event ID (Unique Slug)</label>
                                <input name="id" type="text" placeholder="e.g. coding-clash-2026" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Event Name</label>
                                <input name="name" type="text" placeholder="e.g. Coding Clash" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Club Name</label>
                                <input name="club" type="text" placeholder="e.g. Coding Club" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 ml-1">Type</label>
                                    <select name="type" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors">
                                        <option value="solo">Solo</option>
                                        <option value="duo">Duo</option>
                                        <option value="group">Group</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 ml-1">Max Members</label>
                                    <input name="maxMembers" type="number" min="1" defaultValue="1" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-pink-500">Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 ml-1">Price (₹)</label>
                                    <input name="price" type="number" min="0" defaultValue="0" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 ml-1">Prize Pool</label>
                                    <input name="prizePool" type="text" placeholder="e.g. ₹5000" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Description</label>
                                <textarea name="description" rows={4} placeholder="Event description..." required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10 my-6" />

                    {/* Schedule */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-blue-400">Schedule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Day Number</label>
                                <input name="dayNumber" type="number" min="1" max="3" defaultValue="1" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Category</label>
                                <select name="category" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors">
                                    <option value="Technical">Technical</option>
                                    <option value="Cultural">Cultural</option>
                                    <option value="Seminar">Seminar</option>
                                    <option value="Sports">Sports</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Timing</label>
                                <input name="timing" type="text" placeholder="e.g. 10:00 AM - 1:00 PM" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Venue</label>
                                <input name="venue" type="text" placeholder="e.g. Lab 301" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            {isPending ? 'Creating Event...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

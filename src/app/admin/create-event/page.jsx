'use client';

import { useActionState, useEffect, useState } from 'react';
import { createEventAction } from '@/server-actions/events';
import { useRouter } from 'next/navigation';

const initialState = {
    error: '',
    success: false,
    eventId: ''
};

export default function CreateEventPage() {
    const [state, formAction, isPending] = useActionState(createEventAction, initialState);
    const router = useRouter();

    useEffect(() => {
        if (state?.success && state?.eventId) {
            router.push(`/admin/events/${state.eventId}/slots`);
        }
    }, [state, router]);

    return (
        <div className="relative min-h-screen bg-galaxy-dark text-white pt-24 px-4 pb-20">
            <div className="relative z-10 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-galaxy-purple">
                    Create New Event
                </h1>
                <CreateEventForm state={state} formAction={formAction} isPending={isPending} />
            </div>
        </div>
    );
}

function CreateEventForm({ state, formAction, isPending }) {
    const [hasPrize, setHasPrize] = useState(true);
    const [isPaid, setIsPaid] = useState(true);

    // Controlled inputs to prevent React errors
    const [price, setPrice] = useState('');
    const [prizePool, setPrizePool] = useState('');
    const [category, setCategory] = useState('Technical');
    const [allowedBranches, setAllowedBranches] = useState([]);

    useEffect(() => {
        if (!isPaid) setPrice(0);
    }, [isPaid]);

    useEffect(() => {
        if (!hasPrize) setPrizePool('');
    }, [hasPrize]);

    return (
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
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Event Name</label>
                        <input name="name" type="text" placeholder="e.g. Coding Clash" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Club Name</label>
                        <input name="club" type="text" placeholder="e.g. Coding Club" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                    </div>

                    {/* Combined Row */}
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
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Category</label>
                            <select
                                name="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors"
                            >
                                <option value="Technical">Technical</option>
                                <option value="Cultural">Cultural</option>
                                <option value="Seminar">Seminar</option>

                            </select>
                        </div>
                    </div>

                    {category === 'Seminar' && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 ml-1">Restricted Branches (Optional)</label>
                            <input type="hidden" name="allowedBranches" value={JSON.stringify(allowedBranches)} />
                            <BranchSelector selected={allowedBranches} onChange={setAllowedBranches} />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Max Members (per team)</label>
                        <input name="maxMembers" type="number" min="1" defaultValue="1" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-pink-500">Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="isPaid"
                                    checked={isPaid}
                                    onChange={(e) => setIsPaid(e.target.checked)}
                                    className="w-4 h-4 accent-galaxy-purple"
                                />
                                <label htmlFor="isPaid" className="text-sm text-gray-400 select-none cursor-pointer">Is Paid Event?</label>
                            </div>
                            <label className={`block text-sm text-gray-400 mb-1 ml-1 ${!isPaid ? 'opacity-50' : ''}`}>Price (₹)</label>
                            <input
                                name="price"
                                type="number"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                readOnly={!isPaid}
                                className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors ${!isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="hasPrize"
                                    checked={hasPrize}
                                    onChange={(e) => setHasPrize(e.target.checked)}
                                    className="w-4 h-4 accent-galaxy-purple"
                                />
                                <label htmlFor="hasPrize" className="text-sm text-gray-400 select-none cursor-pointer">Has Prize?</label>
                            </div>
                            <input
                                name="prizePool"
                                type="text"
                                placeholder={hasPrize ? "e.g. ₹5000" : "No Prize"}
                                disabled={!hasPrize}
                                value={prizePool}
                                onChange={(e) => setPrizePool(e.target.value)}
                                required={hasPrize}
                                className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors ${!hasPrize ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
                            />
                            {!hasPrize && <div className="w-full bg-black/10 border border-white/5 rounded-xl px-4 py-3 text-gray-500">No Prize</div>}
                        </div>
                    </div>

                </div>
            </div>

            <div className="pt-6">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                    {isPending ? 'Creating Event...' : 'Create Event & Add Slots →'}
                </button>
            </div>
        </form>
    );
}

function BranchSelector({ selected, onChange }) {
    // Keep comps mech extc elect cse/it
    const branches = ['COMPS', 'CSE/IT', 'EXTC', 'MECH', 'ELECT'];

    const toggleBranch = (branch) => {
        if (selected.includes(branch)) {
            onChange(selected.filter(b => b !== branch));
        } else {
            onChange([...selected, branch]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {branches.map(branch => {
                const isSelected = selected.includes(branch);
                return (
                    <button
                        key={branch}
                        type="button"
                        onClick={() => toggleBranch(branch)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isSelected
                            ? 'bg-galaxy-purple text-white border-galaxy-purple shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                            : 'bg-black/20 text-gray-400 border-white/10 hover:bg-white/5'
                            }`}
                    >
                        {branch}
                    </button>
                );
            })}
        </div>
    );
}

'use client';

import { useActionState, useEffect, useState, use } from 'react';
import { updateEventAction, getEventByIdAction } from '@/server-actions/events';
import { useRouter } from 'next/navigation';

const initialState = {
    error: '',
    success: false
};

export default function EditEventPage({ params }) {
    const resolvedParams = use(params);
    const eventId = resolvedParams.id;
    const router = useRouter();

    // We can reuse the create action logic if we modify it to handle updates,
    // or create a new updateEventAction. For simplicity/clarity, let's assume updateEventAction.
    // However, for now, let's fetch data first.

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [state, formAction, isPending] = useActionState(updateEventAction, initialState);

    useEffect(() => {
        async function fetchEvent() {
            const data = await getEventByIdAction(eventId);
            if (data) {
                setEventData(data);
            }
            setLoading(false);
        }
        fetchEvent();
    }, [eventId]);

    useEffect(() => {
        if (state?.success) {
            router.push('/admin'); // Or redirect to slots
            router.refresh();
        }
    }, [state, router]);

    if (loading) return <div className="text-white text-center pt-24">Loading Event...</div>;
    if (!eventData) return <div className="text-red-400 text-center pt-24">Event not found.</div>;

    return (
        <div className="relative min-h-screen bg-galaxy-dark text-white pt-24 px-4 pb-20">
            <div className="relative z-10 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-galaxy-purple">
                    Edit Event: {eventData.name}
                </h1>

                <form action={formAction} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl space-y-6">
                    <input type="hidden" name="dbId" value={eventId} /> {/* Pass Mongo ID */}

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
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Event ID (Slug)</label>
                                <input name="id" type="text" defaultValue={eventData.id} readOnly className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed" />
                                <p className="text-xs text-gray-500 ml-1 mt-1">ID cannot be changed.</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Event Name</label>
                                <input name="name" type="text" defaultValue={eventData.name} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Club Name</label>
                                <input name="club" type="text" defaultValue={eventData.club} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple focus:ring-1 focus:ring-galaxy-purple transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 ml-1">Type</label>
                                    <select name="type" defaultValue={eventData.type} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple">
                                        <option value="solo">Solo</option>
                                        <option value="duo">Duo</option>
                                        <option value="group">Group</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 ml-1">Category</label>
                                    <select name="category" defaultValue={eventData.category} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple">
                                        <option value="Technical">Technical</option>
                                        <option value="Cultural">Cultural</option>
                                        <option value="Seminar">Seminar</option>

                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Max Members</label>
                                <input name="maxMembers" type="number" min="1" defaultValue={eventData.maxMembers} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple" />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-pink-500">Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <PriceInput initialValue={eventData.price} />
                                </div>
                                <div>
                                    <PrizeInput initialValue={eventData.prizePool} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1 ml-1">Description</label>
                                <textarea name="description" rows={6} defaultValue={eventData.description} required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple" />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input name="isPublished" type="checkbox" defaultChecked={eventData.isPublished} className="w-5 h-5 accent-galaxy-purple" />
                                <label className="text-white">Published (Visible to users)</label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-[2] bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            {isPending ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function PriceInput({ initialValue }) {
    const isInitiallyPaid = initialValue > 0;
    const [isPaid, setIsPaid] = useState(isInitiallyPaid);
    const [price, setPrice] = useState(initialValue || 0);

    return (
        <>
            <div className="flex items-center gap-2 mb-1">
                <input
                    type="checkbox"
                    id="isPaid"
                    checked={isPaid}
                    onChange={(e) => {
                        const checked = e.target.checked;
                        setIsPaid(checked);
                        if (!checked) setPrice(0);
                    }}
                    className="w-4 h-4 accent-galaxy-purple"
                />
                <label htmlFor="isPaid" className="text-xs text-gray-400 select-none cursor-pointer">Is Paid?</label>
            </div>
            <input
                name="price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                readOnly={!isPaid}
                className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple ${!isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
        </>
    );
}

function PrizeInput({ initialValue }) {
    const hasInitialPrize = initialValue && initialValue !== '0' && initialValue !== '';
    const [hasPrize, setHasPrize] = useState(hasInitialPrize);
    const [prize, setPrize] = useState(initialValue || "₹5000");

    return (
        <>
            <div className="flex items-center gap-2 mb-1">
                <input
                    type="checkbox"
                    id="hasPrize"
                    checked={hasPrize}
                    onChange={(e) => {
                        const checked = e.target.checked;
                        setHasPrize(checked);
                        if (!checked) setPrize(""); // Or keep it but don't submit if disabling? Better to clear or let logic handle.
                    }}
                    className="w-4 h-4 accent-galaxy-purple"
                />
                <label htmlFor="hasPrize" className="text-xs text-gray-400 select-none cursor-pointer">Has Prize?</label>
            </div>
            {hasPrize ? (
                <input
                    name="prizePool"
                    type="text"
                    value={prize}
                    onChange={(e) => setPrize(e.target.value)}
                    placeholder="e.g. ₹5000"
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-galaxy-purple"
                />
            ) : (
                <div className="w-full bg-black/10 border border-white/5 rounded-xl px-4 py-3 text-gray-500">
                    No Prize
                    {/* Hidden input to ensure value is submitted as empty if desired, though server handles logic */}
                </div>
            )}
        </>
    );
}

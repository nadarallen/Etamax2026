'use client';

import { useRef, useEffect, useState, use, useTransition } from 'react';
import { addSlotAction, getSlotsAction, deleteSlotAction, updateSlotAction } from '@/server-actions/events';
import { useRouter } from 'next/navigation';
import { Trash2, Clock, MapPin, Edit2, Plus, Save, X, Link as LinkIcon } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

const initialState = {
    error: '',
    success: false
};

export default function ManageSlotsPage({ params }) {
    const resolvedParams = use(params);
    const eventId = resolvedParams.id;

    const [slots, setSlots] = useState([]);
    const [editingSlot, setEditingSlot] = useState(null);
    const { user, loading } = useAuth();
    // Fix: user object from useAuth/api has role at top level, not in user_metadata
    const isAdmin = user?.role === 'SUPER_ADMIN';
    const backLink = isAdmin ? '/admin' : '/club';

    const [formData, setFormData] = useState({
        dayNumber: "1",
        maxCapacity: "30",
        startTime: "",
        endTime: "",
        venue: "",
        whatsappLink: ""
    });

    // We wrapper the action to handle both add and update based on editingSlot
    const [isPending, startTransition] = useTransition();
    const [actionState, setActionState] = useState(initialState);

    const handleSubmit = (e) => {
        e.preventDefault();
        startTransition(async () => {
            const formDataObj = new FormData();
            Object.entries(formData).forEach(([key, value]) => formDataObj.append(key, value));

            let res;
            if (editingSlot) {
                res = await updateSlotAction(eventId, editingSlot._id, formDataObj);
                if (res.success) handleCancelEdit();
            } else {
                res = await addSlotAction(eventId, formDataObj);
                if (res.success) {
                    setFormData(prev => ({ ...prev, startTime: "", endTime: "", venue: "", whatsappLink: "" }));
                }
            }
            setActionState(res);
        });
    };

    // Fetch Slots
    const fetchSlots = async () => {
        const data = await getSlotsAction(eventId);
        setSlots(data);
    };

    useEffect(() => {
        fetchSlots();
    }, [eventId, actionState?.success]);

    const handleDelete = async (slotId) => {
        if (confirm('Delete this slot?')) {
            await deleteSlotAction(slotId, eventId);
            fetchSlots();
        }
    };

    const handleEdit = (slot) => {
        setEditingSlot(slot);
        setFormData({
            dayNumber: String(slot.dayNumber),
            maxCapacity: String(slot.maxCapacity),
            startTime: slot.startTime,
            endTime: slot.endTime,
            venue: slot.venue,
            whatsappLink: slot.whatsappLink || ""
        });
    };

    const handleCancelEdit = () => {
        setEditingSlot(null);
        setFormData({
            dayNumber: "1",
            maxCapacity: "30",
            startTime: "",
            endTime: "",
            venue: "",
            whatsappLink: ""
        });
    };

    // Helper to convert 24h "13:00" -> "01:00 PM"
    const to12Hour = (time24) => {
        if (!time24) return "";
        const [h, m] = time24.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${String(hour12).padStart(2, '0')}:${m} ${ampm}`;
    };

    // Helper to convert 12h "01:00 PM" -> "13:00" for input value
    const to24Hour = (time12) => {
        if (!time12) return "";
        const [time, modifier] = time12.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'startTime' || name === 'endTime') {
            // value from type="time" is always 24h format e.g., "13:00"
            // We convert it to 12h format for storage
            setFormData(prev => ({ ...prev, [name]: to12Hour(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };



    if (loading) {
        return <div className="min-h-screen bg-galaxy-dark flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="relative min-h-screen bg-galaxy-dark text-white pt-24 px-4 pb-20">
            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-galaxy-purple">
                        Manage Event Slots
                    </h1>
                    <Link href={backLink} className="text-gray-400 hover:text-white transition-colors">Done</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add/Edit Slot Form */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl h-fit sticky top-24">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={`text-xl font-semibold ${editingSlot ? 'text-galaxy-accent' : 'text-pink-400'}`}>
                                {editingSlot ? 'Edit Slot' : 'Add New Slot'}
                            </h2>
                            {editingSlot && (
                                <button onClick={handleCancelEdit} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                                    <X size={12} /> Cancel
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {actionState?.error && <p className="text-red-400 text-sm">{actionState.error}</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Day</label>
                                    <select
                                        name="dayNumber"
                                        value={formData.dayNumber}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    >
                                        <option value="1">Day 1</option>
                                        <option value="2">Day 2</option>
                                        <option value="3">Day 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Max Capacity</label>
                                    <input
                                        name="maxCapacity"
                                        type="number"
                                        value={formData.maxCapacity}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                                    <input
                                        name="startTime"
                                        type="time"
                                        value={to24Hour(formData.startTime)}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">End Time</label>
                                    <input
                                        name="endTime"
                                        type="time"
                                        value={to24Hour(formData.endTime)}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Venue</label>
                                <input
                                    name="venue"
                                    type="text"
                                    placeholder="Lab 301"
                                    value={formData.venue}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">WhatsApp Link (Optional)</label>
                                <input
                                    name="whatsappLink"
                                    type="url"
                                    placeholder="https://chat.whatsapp.com/..."
                                    value={formData.whatsappLink || ''}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending ? 'Saving...' : (editingSlot ? <><Save size={16} /> Update Slot</> : <><Plus size={16} /> Add Slot</>)}
                            </button>
                        </form>
                    </div>

                    {/* Existing Slots List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4 text-blue-400">Existing Slots</h2>
                        {slots.length === 0 && <p className="text-gray-500">No slots added yet.</p>}

                        {slots.map(slot => (
                            <div key={slot._id} className={`bg-white/5 border p-4 rounded-xl flex justify-between items-center group transition-colors ${editingSlot?._id === slot._id ? 'border-galaxy-accent/50 bg-galaxy-accent/5' : 'border-white/10 hover:border-blue-400/50'}`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${editingSlot?._id === slot._id ? 'bg-galaxy-accent text-black' : 'bg-blue-500/20 text-blue-300'}`}>Day {slot.dayNumber}</span>
                                        <span className="text-gray-400 text-sm flex items-center gap-1">
                                            <Clock size={12} /> {slot.startTime} - {slot.endTime}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <span>Cap: {slot.maxCapacity}</span>
                                        {slot.whatsappLink && (
                                            <a href={slot.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-400 hover:underline">
                                                <LinkIcon size={12} /> WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(slot)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                        title="Edit Slot"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(slot._id)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                        title="Delete Slot"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

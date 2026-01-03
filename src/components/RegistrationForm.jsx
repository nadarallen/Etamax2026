'use client';
import { useState } from 'react';

export default function RegistrationForm({ event, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '', rollNo: '', branch: '', email: '', phone: '',
        teamName: '',
        members: [],
    });

    // Initialize members
    const [memberCount, setMemberCount] = useState(event.minTeamSize || 1);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMemberChange = (index, field, value) => {
        const updatedMembers = [...(formData.members || [])];
        if (!updatedMembers[index]) updatedMembers[index] = {};
        updatedMembers[index][field] = value;
        setFormData({ ...formData, members: updatedMembers });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Slot Selection */}
            <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-1">Select Time Slot</label>
                <select
                    name="slotId"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-galaxy-purple transition-colors"
                    onChange={handleChange}
                    defaultValue=""
                >
                    <option value="" disabled>-- Choose a Slot --</option>
                    {event.slots?.map(slot => (
                        <option key={slot._id} value={slot._id} disabled={slot.bookedCount >= slot.capacity}>
                            {new Date(slot.startTime).toLocaleString()} ({slot.capacity - slot.bookedCount} seats left)
                        </option>
                    ))}
                </select>
            </div>

            {/* Common Fields */}
            <h3 className="text-xl font-bold text-galaxy-accent mb-4">
                {event.eventType === 'SOLO' ? 'Participant Details' : 'Team Details'}
            </h3>

            {event.eventType !== 'SOLO' && (
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-1">Team Name</label>
                    <input required type="text" name="teamName" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-colors" onChange={handleChange} />
                </div>
            )}

            {/* Solo or Contact Person */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        {event.eventType === 'SOLO' ? 'Full Name' : 'Team Leader Name'}
                    </label>
                    <input required type="text" name="name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-colors" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Roll No</label>
                    <input required type="text" name="rollNo" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-colors" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Branch</label>
                    <input required type="text" name="branch" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-colors" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input required type="email" name="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-colors" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Phone</label>
                    <input required type="tel" name="phone" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-colors" onChange={handleChange} />
                </div>
            </div>

            {/* Team Members */}
            {event.eventType !== 'SOLO' && (
                <div className="mt-8 space-y-4">
                    <div className="flex  justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-white">Team Members</h4>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">Count:</span>
                            <select
                                className="bg-black/50 border border-gray-600 rounded px-2 py-1 text-white"
                                value={memberCount}
                                onChange={(e) => setMemberCount(parseInt(e.target.value))}
                            >
                                {/* Generate options based on minTeamSize and maxTeamSize */}
                                {[...Array((event.maxTeamSize || 4) - (event.minTeamSize || 2) + 1)].map((_, i) => {
                                    const val = (event.minTeamSize || 2) + i;
                                    return <option key={val} value={val}>{val}</option>
                                })}
                            </select>
                        </div>
                    </div>

                    {/* Render inputs for (memberCount - 1) because Leader is above */}
                    {[...Array(memberCount - 1)].map((_, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <h5 className="text-sm font-semibold text-galaxy-accent mb-3">Member {i + 2}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-colors" onChange={(e) => handleMemberChange(i, 'name', e.target.value)} required />
                                <input placeholder="Roll No" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-colors" onChange={(e) => handleMemberChange(i, 'rollNo', e.target.value)} required />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-galaxy-purple to-pink-600 hover:from-galaxy-purple/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-galaxy-purple/20 transition-all duration-300 active:scale-95 text-lg mt-8 uppercase tracking-widest">
                {event.eventType === 'SOLO' ? 'Pay Now' : 'Create Team & Proceed'}
            </button>
        </form>
    );
}

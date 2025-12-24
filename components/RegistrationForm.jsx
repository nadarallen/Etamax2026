'use client';
import { useState } from 'react';

export default function RegistrationForm({ event, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '', rollNo: '', branch: '', email: '', phone: '',
        teamName: '',
        members: [],
    });

    // Initialize members for duo (2) or group (dynamic)
    const [memberCount, setMemberCount] = useState(event.type === 'duo' ? 2 : 1);

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
            {/* Common Fields */}
            <h3 className="text-xl font-bold text-galaxy-accent mb-4">
                {event.type === 'solo' ? 'Participant Details' : 'Team Details'}
            </h3>

            {event.type !== 'solo' && (
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-1">Team Name</label>
                    <input required type="text" name="teamName" className="input-field" onChange={handleChange} />
                </div>
            )}

            {/* Solo or Contact Person */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        {event.type === 'solo' ? 'Full Name' : 'Team Leader Name'}
                    </label>
                    <input required type="text" name="name" className="input-field" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Roll No</label>
                    <input required type="text" name="rollNo" className="input-field" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Branch</label>
                    <input required type="text" name="branch" className="input-field" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input required type="email" name="email" className="input-field" onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Phone</label>
                    <input required type="tel" name="phone" className="input-field" onChange={handleChange} />
                </div>
            </div>

            {/* Group/Duo Members */}
            {event.type !== 'solo' && (
                <div className="mt-8 space-y-4">
                    <div className="flex  justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-white">Team Members</h4>
                        {event.type === 'group' && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-400">Count:</span>
                                <select
                                    className="bg-black/50 border border-gray-600 rounded px-2 py-1 text-white"
                                    value={memberCount}
                                    onChange={(e) => setMemberCount(parseInt(e.target.value))}
                                >
                                    {[...Array(event.maxMembers - 1)].map((_, i) => (
                                        <option key={i + 2} value={i + 2}>{i + 2}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {[...Array(event.type === 'duo' ? 1 : memberCount - 1)].map((_, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <h5 className="text-sm font-semibold text-galaxy-accent mb-3">Member {i + 2}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input placeholder="Name" className="input-field" onChange={(e) => handleMemberChange(i, 'name', e.target.value)} required />
                                <input placeholder="Roll No" className="input-field" onChange={(e) => handleMemberChange(i, 'rollNo', e.target.value)} required />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button type="submit" className="w-full btn-primary py-3 text-lg mt-8">
                Pay Now
            </button>
        </form>
    );
}

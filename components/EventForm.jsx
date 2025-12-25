'use client';
import { useState } from 'react';

export default function EventForm({ onSubmit, onCancel, initialData = {} }) {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        type: initialData.type || 'solo',
        dayNumber: initialData.dayNumber || 1,
        category: initialData.category || 'Technical',
        club: initialData.club || '',
        price: initialData.price || '',
        prizePool: initialData.prizePool || '',
        maxMembers: initialData.maxMembers || 1,
        description: initialData.description || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClasses = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-galaxy-purple transition-all";
    const labelClasses = "block text-sm text-gray-400 mb-1 font-medium";

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClasses}>Event Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="e.g. Coding Clash" />
                </div>
                <div>
                    <label className={labelClasses}>Club Name</label>
                    <input
                        required
                        type="text"
                        name="club"
                        value={formData.club}
                        onChange={handleChange}
                        className={`${inputClasses} ${initialData.club ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="e.g. Technical Committee"
                        readOnly={!!initialData.club}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={labelClasses}>Event Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className={inputClasses}>
                        <option value="solo" className="bg-gray-900">Solo</option>
                        <option value="duo" className="bg-gray-900">Duo</option>
                        <option value="group" className="bg-gray-900">Group</option>
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>Day</label>
                    <select name="dayNumber" value={formData.dayNumber} onChange={handleChange} className={inputClasses}>
                        <option value="1" className="bg-gray-900">Day 1</option>
                        <option value="2" className="bg-gray-900">Day 2</option>
                        <option value="3" className="bg-gray-900">Day 3</option>
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className={inputClasses}>
                        <option value="Technical" className="bg-gray-900">Technical</option>
                        <option value="Cultural" className="bg-gray-900">Cultural</option>
                        <option value="Seminar" className="bg-gray-900">Seminar</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={labelClasses}>Price (₹)</label>
                    <input required type="number" name="price" value={formData.price} onChange={handleChange} className={inputClasses} placeholder="100" />
                </div>
                <div>
                    <label className={labelClasses}>Prize Pool</label>
                    <input required type="text" name="prizePool" value={formData.prizePool} onChange={handleChange} className={inputClasses} placeholder="₹5000" />
                </div>
                <div>
                    <label className={labelClasses}>Max Participants</label>
                    <input required type="number" name="maxMembers" value={formData.maxMembers} onChange={handleChange} className={inputClasses} />
                </div>
            </div>

            <div>
                <label className={labelClasses}>Description</label>
                <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className={inputClasses} placeholder="Event details..." />
            </div>

            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5 transition-colors">
                    Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-galaxy-purple hover:bg-galaxy-purple/90 text-white rounded-xl font-bold shadow-lg shadow-galaxy-purple/20 transition-all hover:scale-[1.02]">
                    Save Event
                </button>
            </div>
        </form>
    );
}

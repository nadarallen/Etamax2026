import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    dayNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    startTime: {
        type: String,
        required: true
    }, // e.g. "10:00 AM"
    endTime: {
        type: String,
        required: true
    },   // e.g. "01:00 PM"
    venue: {
        type: String,
        required: true
    },
    maxCapacity: {
        type: Number,
        required: true,
        default: 30
    },
    registeredCount: {
        type: Number,
        default: 0
    },
    teamsCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Prevent overbooking at db level? 
// For now, application logic will handle it, but we can add indexes later.

export default mongoose.models.Slot || mongoose.model('Slot', SlotSchema);

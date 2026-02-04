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
    whatsappLink: {
        type: String,
        required: false
    }, // Slot-specific WhatsApp Group
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
        default: 0,
        validate: {
            validator: function (this: any, value: number) {
                // Only validate if maxCapacity exists on this document
                // Note: 'this' might not be the document in update queries, but works for .save()
                return this.maxCapacity ? value <= this.maxCapacity : true;
            },
            message: 'Slot capacity exceeded'
        }
    },
    teamsCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Prevent overbooking at db level? 
// For now, application logic will handle it, but we can add indexes later.

export default mongoose.models.Slot || mongoose.model('Slot', SlotSchema);

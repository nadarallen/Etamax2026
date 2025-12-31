import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
    id: string; // Custom ID like 'coding-clash'
    name: string;
    type: 'solo' | 'duo' | 'group';
    club: string;
    maxMembers: number;
    price: number;
    prizePool: string;
    description: string;
    schedule: {
        dayNumber: number;
        category: string;
        timing: string;
        venue: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema: Schema = new Schema(
    {
        id: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['solo', 'duo', 'group'], required: true },
        club: { type: String, required: true },
        maxMembers: { type: Number, required: true },
        price: { type: Number, required: true },
        prizePool: { type: String, required: true },
        description: { type: String, required: true },
        schedule: {
            dayNumber: { type: Number, required: true },
            category: { type: String, required: true },
            timing: { type: String, required: true },
            venue: { type: String, required: true },
        },
    },
    { timestamps: true }
);

// Prevent overwrite on Hot Reload
const Event: Model<IEvent> =
    mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;

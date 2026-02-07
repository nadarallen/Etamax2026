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
    category: string;
    // schedule removed
    createdAt: Date;
    updatedAt: Date;
    minTeamSize?: number;
    maxTeamSize?: number;
    allowedBranches?: string[]; // Array of branch codes
}

const EventSchema: Schema = new Schema(
    {
        id: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['solo', 'duo', 'group'], required: true, index: true },
        category: { type: String, required: true, index: true }, // Moved from schedule
        club: { type: String, required: true },
        maxMembers: { type: Number, required: true },
        price: { type: Number, required: true },
        prizePool: { type: String, required: false },
        description: { type: String, required: false },
        isPublished: { type: Boolean, default: true, index: true },
        allowedBranches: { type: [String], default: [] }, // Empty = All allowed

        minTeamSize: { type: Number, default: 1 }, // Added
        maxTeamSize: { type: Number, default: 4 }, // Added
        // schedule removed, using Slot model instead
    },
    { timestamps: true }
);

// Prevent overwrite on Hot Reload
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Event;
}
const Event: Model<IEvent> =
    mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;

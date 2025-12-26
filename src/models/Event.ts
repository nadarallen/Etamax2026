import mongoose, { Schema, Document, Model } from 'mongoose';

export enum EventType {
    SOLO = 'SOLO',
    TEAM = 'TEAM',
}

export interface ISlot {
    _id: mongoose.Types.ObjectId;
    startTime: Date;
    endTime: Date;
    capacity: number;
    bookedCount: number;
}

export interface IEvent extends Document {
    clubId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    eventType: EventType;
    minTeamSize: number;
    maxTeamSize: number;
    price: number;
    isPublished: boolean;
    slots: ISlot[];
    createdAt: Date;
    updatedAt: Date;
}

const SlotSchema = new Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
});

const EventSchema: Schema = new Schema(
    {
        clubId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Club Admin
        title: { type: String, required: true },
        description: { type: String },
        eventType: {
            type: String,
            enum: Object.values(EventType),
            required: true,
        },
        minTeamSize: { type: Number, default: 1 },
        maxTeamSize: { type: Number, default: 1 },
        price: { type: Number, required: true },
        isPublished: { type: Boolean, default: false, index: true },
        slots: { type: [SlotSchema], default: [] },
    },
    { timestamps: true }
);

// Indexing for Performance (Prompt 29)
EventSchema.index({ clubId: 1, isPublished: 1 });

const Event: Model<IEvent> =
    mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;

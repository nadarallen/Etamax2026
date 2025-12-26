import mongoose, { Schema, Document, Model } from 'mongoose';

export enum RegStatus {
    PENDING = 'PENDING', // Offline waiting
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    ATTENDED = 'ATTENDED',
}

export interface IRegistration extends Document {
    userId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    slotId: mongoose.Types.ObjectId;
    paymentId: mongoose.Types.ObjectId;
    status: RegStatus;
    qrCodeHash: string;
    createdAt: Date;
    updatedAt: Date;
}

const RegistrationSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
        slotId: { type: Schema.Types.ObjectId, required: true },
        paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
        status: {
            type: String,
            enum: Object.values(RegStatus),
            default: RegStatus.CONFIRMED,
        },
        qrCodeHash: { type: String },
    },
    { timestamps: true }
);

// Compound Index: One User per Event (Prevent Double Booking)
RegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Registration: Model<IRegistration> =
    mongoose.models.Registration ||
    mongoose.model<IRegistration>('Registration', RegistrationSchema);

export default Registration;

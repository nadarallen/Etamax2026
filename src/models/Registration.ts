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
    etamaxId?: string;
    qrCodeHash: string;
    createdAt: Date;
    updatedAt: Date;
}

// ... imports

const RegistrationSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
        slotId: { type: Schema.Types.ObjectId, ref: 'Slot', required: true },
        paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },

        // Snapshot of user details at time of registration
        fullName: { type: String, required: true },
        rollNumber: { type: String, required: true },
        email: { type: String, required: true },
        branch: { type: String, required: true },
        semester: { type: String, required: true },

        status: {
            type: String,
            enum: Object.values(RegStatus),
            default: RegStatus.CONFIRMED,
        },
        etamaxId: { type: String, unique: true, sparse: true },
        qrCodeHash: { type: String },
        expiresAt: { type: Date },
    },
    { timestamps: true }
);

// Compound Index: One User per Event (Prevent Double Booking)
RegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });
RegistrationSchema.index({ eventId: 1 });
RegistrationSchema.index({ slotId: 1 });
RegistrationSchema.index({ status: 1 });

if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Registration;
}

const Registration: Model<IRegistration> =
    mongoose.models.Registration ||
    mongoose.model<IRegistration>('Registration', RegistrationSchema);

export default Registration;

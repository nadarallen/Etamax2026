import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PaymentMethod {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}

export enum PaymentStatus {
    PENDING_VERIFICATION = 'PENDING_VERIFICATION', // Offline
    INITIATED = 'INITIATED', // Online start
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    gatewayOrderId?: string; // Razorpay Order ID
    gatewayPaymentId?: string; // Razorpay Payment ID
    referenceId?: string; // Offline Ref ID
    metadata: {
        eventId?: string;
        teamId?: string;
        slotId?: string;
        registrationIds?: string[];
        type?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        method: {
            type: String,
            enum: Object.values(PaymentMethod),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.INITIATED,
        },
        gatewayOrderId: { type: String, index: true },
        gatewayPaymentId: { type: String },
        referenceId: { type: String }, // User provided for Offline
        metadata: {
            eventId: { type: String, required: false },
            teamId: { type: String },
            slotId: { type: String, required: false },
            registrationIds: { type: [String] },
            type: { type: String }
        },
    },
    { timestamps: true }
);

const Payment: Model<IPayment> =
    mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;

import mongoose, { Schema, Document, Model } from 'mongoose';

export enum TeamStatus {
    OPEN = 'OPEN',
    LOCKED = 'LOCKED', // Pending Payment
    CONFIRMED = 'CONFIRMED', // All Paid
    EXPIRED = 'EXPIRED',
}

export enum MemberStatus {
    PENDING = 'PENDING',
    JOINED = 'JOINED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
}

export interface ITeamMember {
    userId: mongoose.Types.ObjectId;
    status: MemberStatus;
    paymentStatus: PaymentStatus;
    joinedAt: Date;
}

export interface ITeam extends Document {
    name: string;
    code: string;
    eventId: mongoose.Types.ObjectId;
    slotId: mongoose.Types.ObjectId;
    leaderId: mongoose.Types.ObjectId;
    members: ITeamMember[];
    status: TeamStatus;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TeamMemberSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: Object.values(MemberStatus),
        default: MemberStatus.PENDING,
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING,
    },
    joinedAt: { type: Date, default: Date.now },
});

const TeamSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true, index: true }, // 6-char unique code
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        slotId: { type: Schema.Types.ObjectId, required: true }, // Binding to Slot (Prompt 14)
        leaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: { type: [TeamMemberSchema], default: [] },
        status: {
            type: String,
            enum: Object.values(TeamStatus),
            default: TeamStatus.OPEN,
        },
        expiresAt: { type: Date, required: true, index: true }, // TTL Index candidate
    },
    { timestamps: true }
);

// TTL Index for cleanup (Prompt 15) - Actually managed by Cron, but DB TTL is a safety net
// TeamSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Optional: Let Mongo delete it? No, we need logic (refunds). Cron is better.

const Team: Model<ITeam> =
    mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;

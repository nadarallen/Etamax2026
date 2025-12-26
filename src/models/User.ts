import mongoose, { Schema, Document, Model } from 'mongoose';

export enum UserRole {
    STUDENT = 'STUDENT',
    CLUB_ADMIN = 'CLUB_ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface IUser extends Document {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    college?: string;
    clerkId?: string; // If using Clerk, else local Auth provider ID
    passwordHash?: string; // For custom auth
    refreshToken?: string; // Prompt 4: Token Refresh
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, index: true },
        phone: { type: String },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.STUDENT,
        },
        college: { type: String },
        clerkId: { type: String, index: true },
        passwordHash: { type: String, select: false }, // Security: Never query by default
        refreshToken: { type: String, select: false },
    },
    { timestamps: true }
);

// Prevent overwrite on Hot Reload
const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

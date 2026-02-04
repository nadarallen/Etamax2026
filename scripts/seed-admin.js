
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'superadmin@etamax.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is undefined in .env');
    process.exit(1);
}

// Minimal User Schema to match your app
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: 'STUDENT' },
    passwordHash: { type: String, select: false },
    generatedPassword: { type: String, select: false } // Added to ensure it saves
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        // Check if Admin exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

        if (existingAdmin) {
            console.log(`ℹ️ Admin ${ADMIN_EMAIL} already exists. Skipping password reset.`);
            // Ensure role is correct though
            if (existingAdmin.role !== 'SUPER_ADMIN') {
                existingAdmin.role = 'SUPER_ADMIN';
                await existingAdmin.save();
                console.log('✅ Updated role to SUPER_ADMIN.');
            }
        } else {
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await User.create({
                name: 'Super Admin',
                email: ADMIN_EMAIL,
                role: 'SUPER_ADMIN',
                passwordHash: passwordHash,
                generatedPassword: ADMIN_PASSWORD
            });
            console.log(`✅ Super Admin created: ${ADMIN_EMAIL}`);
        }

        console.log(`✅ Super Admin configured: ${result.email}`);
        console.log(`🔑 Password set from .env: ${ADMIN_PASSWORD}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAdmin();

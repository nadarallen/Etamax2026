const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // Need to install bcryptjs if not global, but it's in node_modules

// Load env
const envPath = path.resolve(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        acc[key] = value;
    }
    return acc;
}, {});
const MONGODB_URI = envVars.MONGODB_URI;

// Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, select: false },
    role: { type: String, default: 'STUDENT' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Need to handle model recompilation if multiple runs, though this is standalone script
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
    console.log('🌱 Seeding Test User...');
    try {
        await mongoose.connect(MONGODB_URI);

        const email = 'superadmin@etamax.com';
        const password = 'password123';
        const passwordHash = await bcrypt.hash(password, 10);

        // Check if exists
        const exists = await User.findOne({ email });
        if (exists) {
            console.log('ℹ️ User already exists. Deleting to re-seed...');
            await User.deleteOne({ email });
        }

        const newUser = await User.create({
            name: 'Super Admin',
            email,
            passwordHash,
            role: 'SUPER_ADMIN'
        });

        console.log('✅ User Created Successfully!');
        console.log('ID:', newUser._id);
        console.log('Role:', newUser.role);
    } catch (error) {
        console.error('❌ Super Admin Seed Failed:', error);
    }

    console.log('🌱 Seeding Club Admin...');
    try {
        const email = 'clubadmin@etamax.com';
        const password = 'password123';
        const passwordHash = await bcrypt.hash(password, 10);

        // Check if exists
        const exists = await User.findOne({ email });
        if (exists) {
            console.log('ℹ️ Club Admin already exists. Deleting to re-seed...');
            await User.deleteOne({ email });
        }

        const newUser = await User.create({
            name: 'Club Admin',
            email,
            passwordHash,
            role: 'CLUB_ADMIN'
        });

        console.log('✅ Club Admin Created Successfully!');
        console.log('ID:', newUser._id);
        console.log('Role:', newUser.role);

    } catch (error) {
        console.error('❌ Club Admin Seed Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seed();

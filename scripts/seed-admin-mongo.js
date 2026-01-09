/**
 * Script to seed Admin users (Super Admin / Club Admin) directly into MongoDB.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
require('dotenv').config({ path: '../.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('No MONGODB_URI found in .env.local');
    process.exit(1);
}

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, select: false },
    role: { type: String, default: 'STUDENT' }, // STUDENT, CLUB_ADMIN, SUPER_ADMIN
    college: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmins() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);

        const admins = [
            {
                name: 'Super Admin',
                email: 'superadmin@etamax.com',
                passwordHash: hash,
                role: 'SUPER_ADMIN',
                college: 'FCRIT'
            },
            {
                name: 'Club Admin',
                email: 'clubadmin@etamax.com',
                passwordHash: hash,
                role: 'CLUB_ADMIN',
                college: 'FCRIT'
            }
        ];

        for (const admin of admins) {
            const exists = await User.findOne({ email: admin.email });
            if (exists) {
                console.log(`User ${admin.email} already exists. Updating password/role...`);
                exists.passwordHash = hash;
                exists.role = admin.role;
                await exists.save();
                console.log(`Updated ${admin.email}`);
            } else {
                await User.create(admin);
                console.log(`Created ${admin.email}`);
            }
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Seeding failed:', e);
        process.exit(1);
    }
}

seedAdmins();

/**
 * Script to verify if a specific user exists in MongoDB and check password hash.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) { console.error('No URI'); process.exit(1); }

async function check() {
    try {
        await mongoose.connect(uri);
        console.log('Connected.');

        const email = 'superadmin@etamax.com';
        const pass = 'password123';

        const user = await mongoose.connection.db.collection('users').findOne({ email });
        console.log('User found:', !!user);

        if (user) {
            console.log('Role:', user.role);
            console.log('Has Hash:', !!user.passwordHash);
            if (user.passwordHash) {
                const match = await bcrypt.compare(pass, user.passwordHash);
                console.log('Password "password123" matches:', match);
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();

/**
 * Simple script to test MongoDB connection and count users.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.local' });

const uri = process.env.MONGODB_URI;

console.log('URI loaded:', !!uri);

if (!uri) {
    console.error('No URI found');
    process.exit(1);
}

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to DB!');
        const count = await mongoose.connection.db.collection('users').countDocuments();
        console.log('User count:', count);

        if (count > 0) {
            const users = await mongoose.connection.db.collection('users').find({}, { projection: { email: 1, role: 1 } }).toArray();
            console.log('Users:', users);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Connection failed:', err);
        process.exit(1);
    });

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        }
    });
} catch (e) {
    console.log('Error loading .env.local:', e.message);
}

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('URI:', MONGODB_URI ? MONGODB_URI.replace(/:([^:@]+)@/, ':****@') : 'Undefined');

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing!');
    process.exit(1);
}

async function testConnection() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Currently connected to:', mongoose.connection.name);

        // Check for users
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(`Found ${users.length} users.`);

        users.forEach(u => {
            console.log(`- ${u.email} (${u.role})`);
        });

        if (users.length === 0) {
            console.log('No users found. You may need to run seed script.');
        }

        await mongoose.disconnect();
        console.log('Disconnected.');
    } catch (error) {
        console.error('Connection Failed:', error);
    }
}

testConnection();

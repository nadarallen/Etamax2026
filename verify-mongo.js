const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Load env manually since we don't have dotenv installed guaranteed
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

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
}

// 2. Define simple User Schema locally to avoid import issues with TS
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    role: String,
    passwordHash: { type: String, select: false }
});

const User = mongoose.model('User', UserSchema);

async function verify() {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    // Hide password for safety in logs
    const sanitizedURI = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
    console.log('DEBUG URI:', sanitizedURI);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connection Successful!');

        console.log('🔄 Checking for existing users...');
        const count = await User.countDocuments();
        console.log(`📊 Found ${count} users in database.`);

        if (count === 0) {
            console.log('⚠️ Database is empty. You should try registering via the app.');
        } else {
            const users = await User.find().limit(3);
            console.log('users', users);
        }

    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.message.includes('bad auth')) {
            console.error('💡 Hint: Check your username and password in .env.local');
        }
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
}

verify();

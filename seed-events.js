const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Load Env
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

// 2. Load JSON Data
const eventsData = require('./src/data/events.json');

// 3. Define Schema Locally
const EventSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    type: String,
    club: String,
    maxMembers: Number,
    price: Number,
    prizePool: String,
    description: String,
    schedule: {
        dayNumber: Number,
        category: String,
        timing: String,
        venue: String,
    },
});
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

async function seedEvents() {
    console.log('🌱 Seeding Events...');
    try {
        await mongoose.connect(MONGODB_URI);

        // Clear existing
        await Event.deleteMany({});
        console.log('🗑️  Cleared existing events.');

        // Insert new
        await Event.insertMany(eventsData);
        console.log(`✅ Seeded ${eventsData.length} events successfully!`);

    } catch (error) {
        console.error('❌ Seed Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedEvents();

/**
 * Script to clean up orphan registrations (those with teamId but no valid team linked) for group/duo events.
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Load Env
const envPath = path.resolve(__dirname, '../.env.local');
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

// 2. Define Schemas
const EventSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    type: String, // 'solo', 'duo', 'group'
});
const RegistrationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    fullName: String,
    status: String
});

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

async function cleanOrphans() {
    console.log('🧹 Cleaning Orphan Registrations...');
    try {
        await mongoose.connect(MONGODB_URI);

        // Find Team/Duo Events
        const teamEvents = await Event.find({ type: { $in: ['duo', 'group'] } });
        const teamEventIds = teamEvents.map(e => e._id);
        console.log(`Found ${teamEvents.length} Group/Duo Events.`);

        // Find Registrations for these events that have NO teamId
        const orphans = await Registration.find({
            eventId: { $in: teamEventIds },
            teamId: { $exists: false }
        });

        console.log(`Found ${orphans.length} Orphan Registrations (Group event but no Team).`);

        if (orphans.length > 0) {
            orphans.forEach(o => console.log(` - Deleting Orphan: ${o.fullName} (${o._id}) for Event ID: ${o.eventId}`));

            const res = await Registration.deleteMany({
                eventId: { $in: teamEventIds },
                teamId: { $exists: false }
            });
            console.log(`✅ Deleted ${res.deletedCount} orphans.`);
        } else {
            console.log("✅ No orphans found.");
        }

    } catch (error) {
        console.error('❌ Cleanup Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanOrphans();

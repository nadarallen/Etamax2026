
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'superadmin@etamax.com';

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is undefined in .env');
    process.exit(1);
}

async function cleanup() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        console.log('⚠️  STARTING CLEANUP: Deleting User Data (Registrations, Teams, Users)...');

        // 1. Delete all Registrations
        const regResult = await mongoose.connection.collection('registrations').deleteMany({});
        console.log(`🗑️  Deleted ${regResult.deletedCount} Registrations.`);

        // 2. Delete all Teams
        const teamResult = await mongoose.connection.collection('teams').deleteMany({});
        console.log(`🗑️  Deleted ${teamResult.deletedCount} Teams.`);

        // 3. Delete all Users EXCEPT Admin
        const userResult = await mongoose.connection.collection('users').deleteMany({
            email: { $ne: ADMIN_EMAIL }
        });
        console.log(`🗑️  Deleted ${userResult.deletedCount} Users (kept Admin: ${ADMIN_EMAIL}).`);

        // --- OPTIONAL: Uncomment to delete Events & Slots too ---
        // console.log('⚠️  Deleting Events & Slots...');
        // const slotResult = await mongoose.connection.collection('slots').deleteMany({});
        // console.log(`🗑️  Deleted ${slotResult.deletedCount} Slots.`);
        // const eventResult = await mongoose.connection.collection('events').deleteMany({});
        // console.log(`🗑️  Deleted ${eventResult.deletedCount} Events.`);

        console.log('\n✅ Cleanup Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();

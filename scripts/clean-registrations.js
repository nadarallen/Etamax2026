/**
 * Clean Registration Records Script
 * 
 * This script safely removes all registration, payment, and team data
 * while preserving user accounts and event configurations.
 * 
 * Usage: node scripts/clean-registrations.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function cleanRegistrations() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Import models
        const Registration = require('../src/models/Registration').default;
        const Payment = require('../src/models/Payment').default;
        const Team = require('../src/models/Team').default;

        // Get counts before deletion
        const regCount = await Registration.countDocuments();
        const paymentCount = await Payment.countDocuments();
        const teamCount = await Team.countDocuments();

        console.log('📊 Current Records:');
        console.log(`   - Registrations: ${regCount}`);
        console.log(`   - Payments: ${paymentCount}`);
        console.log(`   - Teams: ${teamCount}\n`);

        if (regCount === 0 && paymentCount === 0 && teamCount === 0) {
            console.log('✅ Database is already clean!');
            process.exit(0);
        }

        console.log('⚠️  WARNING: This will delete ALL registration data!');
        console.log('⚠️  User accounts and events will be preserved.\n');

        // Delete all records
        console.log('🗑️  Deleting registrations...');
        const deletedRegs = await Registration.deleteMany({});
        console.log(`   ✅ Deleted ${deletedRegs.deletedCount} registrations`);

        console.log('🗑️  Deleting payments...');
        const deletedPayments = await Payment.deleteMany({});
        console.log(`   ✅ Deleted ${deletedPayments.deletedCount} payments`);

        console.log('🗑️  Deleting teams...');
        const deletedTeams = await Team.deleteMany({});
        console.log(`   ✅ Deleted ${deletedTeams.deletedCount} teams`);

        // Reset slot counts
        const Slot = require('../src/models/Slot').default;
        console.log('\n🔄 Resetting slot counts...');
        await Slot.updateMany(
            {},
            {
                $set: {
                    registeredCount: 0,
                    teamsCount: 0
                }
            }
        );
        console.log('   ✅ Slot counts reset to 0');

        console.log('\n✅ Database cleaned successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Registrations deleted: ${deletedRegs.deletedCount}`);
        console.log(`   - Payments deleted: ${deletedPayments.deletedCount}`);
        console.log(`   - Teams deleted: ${deletedTeams.deletedCount}`);
        console.log(`   - Slot counts reset: All slots`);

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error cleaning database:', error);
        process.exit(1);
    }
}

// Run the cleanup
cleanRegistrations();

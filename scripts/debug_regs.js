/**
 * Debug script to list all registrations with their user and event details.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.local' });

const RegSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    eventName: String, // Just in case it's denormalized, likely not
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    status: String,
    fullName: String,
}, { timestamps: true });

const Registration = mongoose.models.Registration || mongoose.model('Registration', RegSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String, email: String }));

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const regs = await Registration.find().populate('userId', 'email name').populate('eventId', 'name');
        console.log(`Found ${regs.length} registrations:`);
        regs.forEach(r => {
            console.log(`- User: ${r.userId?.email} (${r.userId?._id}), Event: ${r.eventId?.name}, Status: ${r.status}, ID: ${r._id}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();

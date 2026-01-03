const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define Schemas minimal for population
const SlotSchema = new mongoose.Schema({ venue: String, startTime: String }, { strict: false });
const EventSchema = new mongoose.Schema({ name: String }, { strict: false });
const RegSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
    status: String,
    fullName: String,
}, { timestamps: true });

const Slot = mongoose.models.Slot || mongoose.model('Slot', SlotSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Registration = mongoose.models.Registration || mongoose.model('Registration', RegSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ email: String }), 'users');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        // Find the user first (maybe the one who just registered)
        // We'll list all regs to be sure
        const regs = await Registration.find()
            .populate('eventId')
            .populate({ path: 'slotId', model: 'Slot' })
            .sort({ createdAt: -1 })
            .limit(5);

        console.log(`Found recent regs: ${regs.length}`);
        regs.forEach(r => {
            console.log("--------------------------------------------------");
            console.log("Reg ID:", r._id);
            console.log("User:", r.userId);
            console.log("Event:", r.eventId ? r.eventId.name : "NULL (Populate Failed)");
            console.log("Slot:", r.slotId ? r.slotId._id : "NULL (Populate Failed)");
            if (r.slotId) console.log("Slot Venue:", r.slotId.venue);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();

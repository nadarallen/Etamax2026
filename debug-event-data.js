const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Mock Models
const EventSchema = new mongoose.Schema({ name: String, type: String }, { strict: false });
const SlotSchema = new mongoose.Schema({ eventId: mongoose.Schema.Types.ObjectId, dayNumber: Number, maxCapacity: Number }, { strict: false });
const RegistrationSchema = new mongoose.Schema({ eventId: mongoose.Schema.Types.ObjectId, slotId: mongoose.Schema.Types.ObjectId, teamId: mongoose.Schema.Types.ObjectId, status: String }, { strict: false });

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Slot = mongoose.models.Slot || mongoose.model('Slot', SlotSchema);
const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const event = await Event.findOne({ name: { $regex: /Escape Rooms/i } }).lean();
        if (!event) {
            console.log("Event not found");
            return;
        }

        console.log("Event Found:", event.name, "| Type:", event.type, "| ID:", event._id);

        const slots = await Slot.find({ eventId: event._id }).lean();
        console.log(`Found ${slots.length} slots`);

        // Run the aggregation logic exactly as in server-actions
        const teamCounts = await Registration.aggregate([
            { $match: { eventId: event._id, status: { $ne: 'CANCELLED' }, teamId: { $exists: true, $ne: null } } },
            { $group: { _id: "$slotId", teams: { $addToSet: "$teamId" } } },
            { $project: { _id: 1, count: { $size: "$teams" } } }
        ]);

        const regCounts = await Registration.aggregate([
            { $match: { eventId: event._id, status: { $ne: 'CANCELLED' } } },
            { $group: { _id: "$slotId", count: { $sum: 1 } } }
        ]);

        console.log("--- SLOT DATA ---");
        slots.forEach(s => {
            const tCount = teamCounts.find(r => r._id.toString() === s._id.toString())?.count || 0;
            const rCount = regCounts.find(r => r._id.toString() === s._id.toString())?.count || 0;
            console.log(`Slot Day ${s.dayNumber} [${s.startTime}-${s.endTime}]: Capacity=${s.maxCapacity} | RegUsers=${rCount} | RegTeams=${tCount}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();

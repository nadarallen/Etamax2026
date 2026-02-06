import connectToDatabase from './db';

// Criteria Definitions
// 1. One Event for Day 1, Day 2, Day 3
// 2. One Technical, One Cultural, One Seminar
// 3. At least one Team Event

export async function checkCriteria(userId: string) {
    try {
        await connectToDatabase();
        // Dynamic imports to avoid circular dependency issues if any models import this lib
        const Registration = (await import('@/models/Registration')).default;

        // Fetch all CONFIRMED registrations for the user
        // Fetch CONFIRMED registrations OR PENDING registrations (to check if Team is Confirmed)
        const registrations = await Registration.find({
            userId,
            status: { $in: ['CONFIRMED', 'PENDING'] }
        })
            .populate('eventId')
            .populate('slotId')
            .populate({ path: 'teamId', select: 'status' }) // Check Team Status
            .lean();

        if (!registrations || registrations.length === 0) {
            return { met: false, pending: ['No Registrations'] };
        }

        const categories = new Set();
        const days = new Set();
        let hasTeamEvent = false;

        registrations.forEach((reg: any) => {
            // Robust Check: Valid if Confirmed OR if Team is Confirmed
            const isValid = reg.status === 'CONFIRMED' || (reg.teamId && reg.teamId.status === 'CONFIRMED');

            if (!isValid) return; // Skip invalid/unpaid registrations

            const event = reg.eventId;
            const slot = reg.slotId;

            if (event) {
                if (event.category) categories.add(event.category.trim());
                if (event.type !== 'solo') hasTeamEvent = true;
            }
            if (slot && slot.dayNumber) {
                days.add(slot.dayNumber);
            }
        });

        // Check Requirements
        const hasTechnical = categories.has('Technical');
        const hasCultural = categories.has('Cultural');
        const hasSeminar = categories.has('Seminar');
        const hasDay1 = days.has(1);
        const hasDay2 = days.has(2);
        const hasDay3 = days.has(3);

        const met = hasTechnical && hasCultural && hasSeminar && hasTeamEvent && hasDay1 && hasDay2 && hasDay3;

        const pending = [];
        if (!hasTechnical) pending.push('Technical Event');
        if (!hasCultural) pending.push('Cultural Event');
        if (!hasSeminar) pending.push('Seminar');
        if (!hasTeamEvent) pending.push('Team Event');
        if (!hasDay1) pending.push('Day 1 Event');
        if (!hasDay2) pending.push('Day 2 Event');
        if (!hasDay3) pending.push('Day 3 Event');

        return { met, pending };

    } catch (error) {
        console.error("Criteria Check Error:", error);
        return { met: false, pending: ['Error checking criteria'] };
    }
}

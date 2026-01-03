'use server';

import { z } from 'zod';
import { getSession, Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Registration, { RegStatus } from '@/models/Registration';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import User from '@/models/User';
import nodemailer from 'nodemailer';

const RegistrationSchema = z.object({
    eventId: z.string(),
    slotId: z.string(),
    fullName: z.string().min(2),
    rollNumber: z.string().min(5),
    email: z.string().email(),
    branch: z.string().min(2),
    semester: z.string().optional(),
    paymentMethod: z.enum(['ONLINE', 'OFFLINE', 'FREE']),
    teamAction: z.enum(['CREATE', 'JOIN', 'NONE']).optional(),
    teamName: z.string().optional(),
    teamCode: z.string().optional(),
});

// Configure Nodemailer (Use Env Vars in production)
// Remove top-level transporter
// const transporter = ... 

export async function registerForEventAction(prevState: any, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: 'You must be logged in to register.' };
        }

        const data = Object.fromEntries(formData);
        console.log("Registration Payload:", data);
        const parsed = RegistrationSchema.safeParse(data);

        if (!parsed.success) {
            console.error("Zod Validation Error:", parsed.error);
            const errors = parsed.error.errors || [];
            const messages = errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { error: `Input Validation Failed: ${messages}`, payload: data };
        }

        const { eventId, slotId, fullName, rollNumber, email, branch, semester, paymentMethod } = parsed.data;

        await connectToDatabase();

        // 1. Verify Event and Slot
        const event = await Event.findById(eventId);
        if (!event) return { error: 'Event not found' };

        const slot = await Slot.findById(slotId);
        if (!slot) return { error: 'Slot not found' };

        // 2. Check Capacity
        const registrationCount = await Registration.countDocuments({ slotId, status: { $ne: RegStatus.CANCELLED } });
        if (registrationCount >= slot.maxCapacity) {
            return { error: 'Slot is full. Please choose another slot.' };
        }

        // 3. Unique Roll Number Check
        const existingRollNo = await Registration.findOne({
            eventId,
            rollNumber,
            status: { $ne: RegStatus.CANCELLED }
        });

        if (existingRollNo) {
            return { error: `Roll Number ${rollNumber} is already registered for this event.` };
        }

        // 4. Update Existing Registration Check for Team Updates
        // If user is joining a team, they shouldn't already be in ONE for this event.
        const existing = await Registration.findOne({
            userId: session.user.id,
            eventId: eventId
        });
        if (existing) {
            return { error: 'You are already registered for this event.' };
        }

        console.log("Session:", session);
        if (!session.user?.id) {
            return { error: 'Invalid Session: User ID Not Found.' };
        }

        // new import for Team
        const Team = (await import('@/models/Team')).default;

        let teamId = null;

        // Team Logic (if applicable)
        if (event.type === 'duo' || event.type === 'group') {
            const action = parsed.data.teamAction;

            if (action === 'CREATE') {
                if (!parsed.data.teamName) return { error: 'Team Name is required.' };

                // Generate Unique 6-char Numeric Code (Simpler for users)
                const { customAlphabet } = await import('nanoid');
                const nano = customAlphabet('0123456789', 6);
                let code = nano();

                // Ensure uniqueness
                while (await Team.findOne({ code })) {
                    code = nano();
                }

                const newTeam = await Team.create({
                    name: parsed.data.teamName,
                    code,
                    eventId,
                    leaderId: session.user.id,
                    members: [{
                        userId: session.user.id,
                        status: 'JOINED',
                        paymentStatus: paymentMethod === 'OFFLINE' ? 'PENDING' : 'PAID',
                        joinedAt: new Date()
                    }],
                    status: 'OPEN',
                    slotId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
                });
                teamId = newTeam._id;

            } else if (action === 'JOIN') {
                if (!parsed.data.teamCode) return { error: 'Team Code is required.' };

                // Trim code
                const codeToJoin = parsed.data.teamCode.trim().toUpperCase();

                const team = await Team.findOne({ code: codeToJoin, eventId });
                if (!team) return { error: 'Invalid Team Code for this event.' };

                // Ensure members is array
                if (!Array.isArray(team.members)) {
                    team.members = [];
                }

                const limit = team.maxMembers || event.maxMembers || 4; // Fallback to 4 if all fail

                if (team.members.length >= limit) {
                    return { error: 'Team is full.' };
                }

                // Add to team
                const isMember = team.members.some((m: any) => m.userId.toString() === session.user.id);
                if (!isMember) {
                    // Find Leader's status
                    const leaderMember = team.members.find((m: any) => m.userId.toString() === team.leaderId.toString());
                    const inheritedStatus = leaderMember ? leaderMember.paymentStatus : 'PENDING';

                    team.members.push({
                        userId: session.user.id,
                        status: 'JOINED',
                        paymentStatus: inheritedStatus,
                        joinedAt: new Date()
                    });
                    await team.save();
                } else {
                    return { error: 'You are already in this team.' };
                }
                teamId = team._id;
            }
        }

        // Determine Status based on Payment (or Inheritance)
        let finalStatus = RegStatus.CONFIRMED;
        if (parsed.data.teamAction === 'JOIN') {
            // Re-fetch team to get the status we just pushed (or calculate it again)
            // Ideally avoid refetch. We know inheritedStatus
            const leaderMember = (await Team.findById(teamId)).members.find((m: any) => m.userId.toString() === session.user.id);
            // Actually relying on DB might be safer or just variable.
            // Let's use the logic: If Leader Paid -> Confirmed, Else Pending.
            // We can't easily access 'inheritedStatus' here due to scope. 
            // Let's refactor slightly to keep scope or just re-query.
            // Optimized:
            const teamDoc = await Team.findById(teamId);
            const leader = teamDoc.members.find((m: any) => m.userId.toString() === teamDoc.leaderId.toString());
            finalStatus = (leader?.paymentStatus === 'PAID') ? RegStatus.CONFIRMED : RegStatus.PENDING;
        } else {
            finalStatus = paymentMethod === 'OFFLINE' ? RegStatus.PENDING : RegStatus.CONFIRMED;
        }

        // 4. Create Registration with Unique ID
        const { customAlphabet } = await import('nanoid');
        const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
        const etamaxId = `ETAMAX-${nanoid()}`;

        const newReg = await Registration.create({
            userId: session.user.id,
            eventId,
            teamId, // Linked Here
            slotId,
            fullName,
            rollNumber,
            email,
            branch,
            semester,
            status: finalStatus,
            etamaxId
        });

        // 6. Send Email Receipt (Only if Confirmed/Online)
        if (paymentMethod !== 'OFFLINE' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // ... email logic kept same or simplified ...
            // For brevity in replacement, re-using existing logic but wrapping safely
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                });
                await transporter.sendMail({
                    from: '"Etamax 2026" <' + process.env.EMAIL_USER + '>',
                    to: email,
                    subject: `Registration Confirmed: ${event.name}`,
                    html: `<p>Registration ID: ${etamaxId}</p><p>Status: Confirmed</p>`
                });
            } catch (e) {
                console.error("Email failed", e);
            }
        }

        return {
            success: true,
            message: 'Registration successful! Redirecting to receipt...',
            registrationId: newReg._id.toString(),
            paymentMethod
        };

    } catch (error: any) {
        console.error('Registration Error Full Object:', error);
        if (error.stack) console.error(error.stack);

        let errorMessage = 'Internal Server Error';
        if (error.name === 'ValidationError') {
            // Safe error mapping
            const errors = error.errors ? Object.values(error.errors) : [];
            const messages = errors.map((val: any) => val.message);
            errorMessage = `Validation Failed: ${messages.join(', ')}`;
        } else {
            errorMessage = error.message;
        }

        return { error: errorMessage, payload: Object.fromEntries(formData) };
    }
}

export async function getRegistrationReceiptAction(regId: string) {
    try {
        await connectToDatabase();
        // Ensure models are registered for population
        (await import('@/models/Event')).default;
        (await import('@/models/Slot')).default;

        const reg = await Registration.findById(regId)
            .populate('eventId')
            .populate('slotId')
            .lean();

        console.log("Receipt Fetch - Reg:", reg ? reg._id : "Not Found");
        if (reg && reg.eventId) console.log("Receipt Fetch - Event:", reg.eventId);

        if (!reg) return null;

        // Strictly pick fields to avoid passing complex Mongoose objects (Buffers, etc.)
        // Ensure NO undefined values are returned, use null instead.
        const serialized = {
            _id: reg._id.toString(),
            fullName: reg.fullName || null,
            rollNumber: reg.rollNumber || null,
            email: reg.email || null,
            branch: reg.branch || null,
            semester: reg.semester || null,
            status: reg.status || null,
            paymentMethod: reg.paymentMethod || null,
            etamaxId: reg.etamaxId || null,
            createdAt: reg.createdAt ? reg.createdAt.toISOString() : null,
            updatedAt: reg.updatedAt ? reg.updatedAt.toISOString() : null,
            // Manual population serialization
            eventId: reg.eventId && typeof reg.eventId === 'object' && 'name' in reg.eventId ? {
                // @ts-ignore
                name: reg.eventId.name || null,
                // @ts-ignore
                price: reg.eventId.price || 0,
                // @ts-ignore
                type: reg.eventId.type || 'N/A',
                // @ts-ignore
                category: reg.eventId.category || 'N/A',
                // @ts-ignore
                _id: reg.eventId._id ? reg.eventId._id.toString() : null
            } : null,
            slotId: reg.slotId && typeof reg.slotId === 'object' && 'venue' in reg.slotId ? {
                // @ts-ignore
                startTime: reg.slotId.startTime,
                // @ts-ignore
                endTime: reg.slotId.endTime,
                // @ts-ignore
                venue: reg.slotId.venue || null,
                // @ts-ignore
                dayNumber: reg.slotId.dayNumber || null,
                // @ts-ignore
                _id: reg.slotId._id ? reg.slotId._id.toString() : null
            } : null,
        };


        return serialized;
    } catch (error) {
        console.error("Fetch Receipt Error:", error);
        return null; // Return null instead of erroring to client
    }
}

export async function updateRegistrationStatusAction(regId: string, newStatus: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        const Registration = (await import('@/models/Registration')).default;
        (await import('@/models/Event')).default;
        (await import('@/models/Slot')).default;

        // Verify status validity if needed, or rely on TS/Schema
        const validStatuses = [RegStatus.PENDING, RegStatus.CONFIRMED, RegStatus.CANCELLED];
        if (!validStatuses.includes(newStatus as any)) {
            return { error: 'Invalid status provided' };
        }

        const updatedReg = await Registration.findByIdAndUpdate(
            regId,
            { status: newStatus },
            { new: true }
        ).populate('eventId').populate('slotId');

        if (!updatedReg) return { error: 'Registration not found' };

        // CASCADE UPDATE for Team Leaders
        if (updatedReg.teamId) {
            const Team = (await import('@/models/Team')).default; // Dynamic import if needed
            const team = await Team.findById(updatedReg.teamId);

            if (team && team.leaderId.toString() === updatedReg.userId.toString()) {
                console.log(`Leader ${updatedReg.fullName} updated to ${newStatus}. Cascading to members...`);

                // 1. Update Team Members Payment Status
                const newPaymentStatus = newStatus === RegStatus.CONFIRMED ? 'PAID' : 'PENDING';
                let memberUserIds = [];

                team.members.forEach((m: any) => {
                    m.paymentStatus = newPaymentStatus;
                    memberUserIds.push(m.userId);
                });
                if (newStatus === RegStatus.CONFIRMED) {
                    team.status = 'CONFIRMED';
                }
                await team.save();

                // 2. Update Registration Status for all members (except leader, already done)
                await Registration.updateMany(
                    {
                        teamId: team._id,
                        userId: { $ne: updatedReg.userId } // Skip leader
                    },
                    { status: newStatus }
                );
                console.log(`Cascaded update to ${memberUserIds.length - 1} members.`);
            }
        }

        // If newly confirmed, send email
        if (newStatus === RegStatus.CONFIRMED) {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                console.log(`Sending approval email to: ${updatedReg.email}`);

                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        },
                    });

                    await transporter.sendMail({
                        from: '"Etamax 2026" <' + process.env.EMAIL_USER + '>',
                        to: updatedReg.email,
                        subject: `Registration Update: ${updatedReg.eventId.name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; color: #333;">
                                <h1>Registration Status Updated</h1>
                                <p>Hi ${updatedReg.fullName},</p>
                                <p>Your registration status for <strong>${updatedReg.eventId.name}</strong> has been updated to <strong>${newStatus}</strong>.</p>
                                <hr />
                                <p><strong>Event Details:</strong></p>
                                <ul>
                                    <li><strong>Event:</strong> ${updatedReg.eventId.name}</li>
                                    <li><strong>Venue:</strong> ${updatedReg.slotId.venue}</li>
                                    <li><strong>Day:</strong> Day ${updatedReg.slotId.dayNumber}</li>
                                    <li><strong>Time:</strong> ${updatedReg.slotId.startTime} - ${updatedReg.slotId.endTime}</li>
                                </ul>
                                <p><strong>Current Status:</strong> ${newStatus}</p>
                                <p>Please show this email at the entry if Confirmed.</p>
                                <br />
                                <p>Best regards,<br/>Etamax Team</p>
                            </div>
                        `,
                    });
                } catch (emailError) {
                    console.error("Failed to send update email:", emailError);
                }
            }
        }

        return { success: true, newStatus };
    } catch (error) {
        console.error('Update Status Error:', error);
        return { error: 'Failed to update status' };
    }
}

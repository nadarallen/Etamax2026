'use server';

import { z } from 'zod';
import { getSession, Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Registration, { RegStatus } from '@/models/Registration';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import User from '@/models/User';
import Team from '@/models/Team';
import { sendEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { getUserRegistrationsAction } from './user';

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

// Constants for Enums
const STATUS_JOINED = 'JOINED';
const STATUS_PENDING = 'PENDING';
const STATUS_PAID = 'PAID';
const TEAM_STATUS_CONFIRMED = 'CONFIRMED';

export async function registerForEventAction(prevState: any, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: 'You must be logged in to register.' };
        }

        const rawData = Object.fromEntries(formData);
        // Ensure serialization safety for client (Next.js Server Action issue)
        const data: Record<string, any> = {};
        for (const [key, value] of Object.entries(rawData)) {
            if (typeof value === 'string') {
                data[key] = value;
            } else {
                // If it's a file, we might skip it or just store filename? 
                // For registration form, we expect strings.
                data[key] = "";
            }
        }

        console.log("Registration Payload (Sanitized):", data);
        const parsed = RegistrationSchema.safeParse(data);

        if (!parsed.success) {
            console.error("Zod Validation Error:", parsed.error);
            const errors = (parsed.error as any).errors || (parsed.error as any).issues || [];
            const messages = errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { error: `Input Validation Failed: ${messages}`, payload: data };
        }

        const { eventId, slotId, fullName, rollNumber, email, branch, semester } = parsed.data;
        let { paymentMethod } = parsed.data;

        // Force 'FREE' payment method if joining a team (Double check logic)
        if (parsed.data.teamAction === 'JOIN') {
            paymentMethod = 'FREE';
        }

        await connectToDatabase();

        // 1. Verify Event and Slot
        const event = await Event.findById(eventId).lean();
        if (!event) return { error: 'Event not found' };

        const slot = await Slot.findById(slotId).lean();
        if (!slot) return { error: 'Slot not found' };

        // 2. Check Capacity
        let currentCount = 0;
        const isTeamEvent = ['duo', 'group'].includes(event.type);

        if (isTeamEvent) {
            // For team events, count unique teams
            const uniqueTeams = await Registration.distinct('teamId', {
                slotId,
                status: { $ne: RegStatus.CANCELLED },
                teamId: { $exists: true, $ne: null }
            });
            currentCount = uniqueTeams.length;
        } else {
            // For solo events, count registrations
            currentCount = await Registration.countDocuments({ slotId, status: { $ne: RegStatus.CANCELLED } });
        }

        if (currentCount >= (slot as any).maxCapacity) {
            return { error: 'Slot is full. Please choose another slot.' };
        }

        // 3. Unique Roll Number Check
        const existingRollNo = await Registration.findOne({
            eventId,
            rollNumber,
            status: { $ne: RegStatus.CANCELLED }
        }).lean();

        if (existingRollNo) {
            return { error: `Roll Number ${rollNumber} is already registered for this event.` };
        }

        // 4. Check for Existing Registration & Reactivation Logic
        const existingReg = await Registration.findOne({
            userId: session.user.id,
            eventId: eventId
        }); // Keep this mongoose doc for .save() later if reactivating

        let isReactivation = false;
        if (existingReg) {
            if (existingReg.status !== RegStatus.CANCELLED) {
                return { error: 'You are already registered for this event.' };
            }
            isReactivation = true;
        }

        if (!session.user?.id) {
            return { error: 'Invalid Session: User ID Not Found.' };
        }

        // Team Logic Dependencies
        // const Team = (await import('@/models/Team')).default;

        let teamId = null;

        // Team Logic (Create or Join)
        if (event.type === 'duo' || event.type === 'group') {
            const action = parsed.data.teamAction;

            if (action === 'CREATE') {
                if (!parsed.data.teamName) return { error: 'Team Name is required.' };

                const { customAlphabet } = await import('nanoid');
                const nano = customAlphabet('0123456789', 6);
                let code = nano();

                while (await Team.findOne({ code }).lean()) {
                    code = nano();
                }

                const newTeam = await Team.create({
                    name: parsed.data.teamName,
                    code,
                    eventId,
                    leaderId: session.user.id,
                    members: [{
                        userId: session.user.id,
                        status: STATUS_JOINED,
                        paymentStatus: paymentMethod === 'OFFLINE' ? STATUS_PENDING : STATUS_PAID,
                        joinedAt: new Date()
                    }],
                    status: 'OPEN',
                    slotId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                });
                teamId = newTeam._id;

            } else if (action === 'JOIN') {
                if (!parsed.data.teamCode) return { error: 'Team Code is required.' };
                const codeToJoin = parsed.data.teamCode.trim().toUpperCase();

                const team = await Team.findOne({ code: codeToJoin, eventId });
                if (!team) return { error: 'Invalid Team Code for this event.' };

                if (!Array.isArray(team.members)) team.members = [];

                const limit = (team as any).maxMembers || (event as any).maxMembers || 4;
                if (team.members.length >= limit) return { error: 'Team is full.' };

                const isMember = team.members.some((m: any) => m.userId.toString() === session.user.id);
                if (!isMember) {
                    const leaderMember = team.members.find((m: any) => m.userId.toString() === team.leaderId.toString());
                    const inheritedStatus = leaderMember ? leaderMember.paymentStatus : 'PENDING';

                    team.members.push({
                        userId: session.user.id,
                        status: STATUS_JOINED,
                        paymentStatus: inheritedStatus,
                        joinedAt: new Date()
                    } as any);
                    await team.save();
                } else {
                    return { error: 'You are already in this team.' };
                }
                teamId = team._id;
            }
        }

        // Determine Status
        let finalStatus = RegStatus.CONFIRMED;
        if (parsed.data.teamAction === 'JOIN') {
            const teamDoc = await Team.findById(teamId);
            if (teamDoc) {
                const leader = teamDoc.members.find((m: any) => m.userId.toString() === teamDoc.leaderId.toString());
                finalStatus = (leader?.paymentStatus === STATUS_PAID) ? RegStatus.CONFIRMED : RegStatus.PENDING;
            } else {
                finalStatus = RegStatus.PENDING;
            }
        } else {
            finalStatus = paymentMethod === 'OFFLINE' ? RegStatus.PENDING : RegStatus.CONFIRMED;
        }

        const { customAlphabet } = await import('nanoid');
        const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
        const etamaxId = `ETAMAX-${nanoid()}`;
        let newReg;

        // DB Operations: Create or Update
        if (isReactivation && existingReg) {
            console.log(`Reactivating cancelled registration ${existingReg._id}`);
            existingReg.status = finalStatus;
            existingReg.slotId = slotId as any;
            existingReg.fullName = fullName;
            existingReg.rollNumber = rollNumber;
            existingReg.email = email;
            existingReg.branch = branch;
            existingReg.semester = semester || "";
            existingReg.teamId = teamId as any;
            existingReg.paymentMethod = paymentMethod;
            existingReg.etamaxId = etamaxId;
            existingReg.createdAt = new Date(); // Reset timestamp

            await existingReg.save();
            newReg = existingReg;
        } else {
            newReg = await Registration.create({
                userId: session.user.id,
                eventId,
                teamId,
                slotId,
                fullName,
                rollNumber,
                email,
                branch,
                semester,
                status: finalStatus,
                etamaxId
            });
        }

        // 5. Reserve Slot Capacity (ATOMICALLY)
        // Race Condition Fix: Check capacity AND increment in one DB operation
        const slotUpdate = await Slot.findOneAndUpdate(
            {
                _id: slotId,
                $expr: { $lt: ["$registeredCount", "$maxCapacity"] } // Atomic condition
            },
            {
                $inc: {
                    registeredCount: 1,
                    teamsCount: isTeamEvent ? 1 : 0
                }
            },
            { new: true }
        );

        if (!slotUpdate) {
            // Rollback Registration if slot reservation failed (Capacity full during race condition)
            await Registration.findByIdAndDelete(newReg._id);
            if (teamId && parsed.data.teamAction === 'CREATE') {
                await Team.findByIdAndDelete(teamId);
            }
            return { error: 'Slot became full just now. Please try another slot.' };
        }

        // 6. Send Email Receipt (Only for FREE events or Team Joins that are 'FREE')
        if (paymentMethod === 'FREE' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {

            // --- Master Receipt Logic ---
            const { checkCriteria } = await import('@/lib/criteria');
            const { met: criteriaMet, pending } = await checkCriteria(session.user.id);

            console.log(`Free Reg Criteria Check for ${session.user.id}: ${criteriaMet ? 'MET' : 'PENDING'}`, pending);

            if (criteriaMet) {
                const Registration = (await import('@/models/Registration')).default;
                const allConfirmedRegs = await Registration.find({
                    userId: session.user.id,
                    status: 'CONFIRMED'
                })
                    .populate('eventId')
                    .populate('slotId')
                    .populate('teamId');

                let totalCost = 0;
                const eventRows = allConfirmedRegs.map((reg: any) => {
                    const evt = reg.eventId;
                    const slt = reg.slotId;
                    const price = evt?.price || 0;
                    totalCost += price;

                    let dateStr = 'TBD';
                    if (slt?.dayNumber) {
                        const dayMap: { [key: number]: string } = {
                            1: 'Feb 12',
                            2: 'Feb 13',
                            3: 'Feb 14'
                        };
                        dateStr = dayMap[slt.dayNumber] || `Day ${slt.dayNumber}`;
                    }

                    // Criteria is MET here, so show link
                    const waLink = evt?.whatsappLink
                        ? `<a href="${evt.whatsappLink}" style="color: #25D366; text-decoration: none; font-weight: bold;">Join Group</a>`
                        : '<span style="color: #999;">-</span>';

                    return `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${evt?.name || 'Unknown'}</td>
                        <td style="padding: 10px;">${dateStr} <br/> <small>${slt?.startTime} - ${slt?.endTime}</small></td>
                        <td style="padding: 10px;">${waLink}</td>
                        <td style="padding: 10px; text-align: right;">₹${price}</td>
                    </tr>
                    `;
                }).join('');

                const criteriaMessage = `<div style="margin-top: 20px; padding: 15px; background-color: #f0fff4; border: 1px solid #b2f5ea; border-radius: 6px;">
                        <p style="margin: 0; font-size: 14px; color: #2e7d32;">
                            <strong>✅ Congratulations!</strong> You have fulfilled all participation criteria. Please join the WhatsApp groups above.
                        </p>
                       </div>`;


                await sendEmail({
                    to: email,
                    subject: `🎉 All Criteria Met! here is your Master Receipt ✅`,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                                <h1 style="margin: 0; font-size: 24px;">All Set! 🎉</h1>
                            </div>
                            <div style="padding: 20px;">
                                <p style="font-size: 16px;">Hello <strong>${fullName}</strong>,</p>
                                <p style="font-size: 16px;">Your registration for <strong>${event.name}</strong> is confirmed.</p>
                                <p style="font-size: 16px;">Since you have fulfilled all criteria, here is your updated master receipt:</p>

                                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                                    <thead>
                                        <tr style="background-color: #f8f9fa; text-align: left;">
                                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Event</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Date/Time</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">WhatsApp</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${eventRows}
                                        <tr style="font-weight: bold; background-color: #f8f9fa;">
                                            <td colspan="3" style="padding: 10px; text-align: right;">Total Paid:</td>
                                            <td style="padding: 10px; text-align: right;">₹${totalCost}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                ${criteriaMessage}
                                <br />
                                <p style="font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                                    <strong>Disclaimer:</strong> Please ensure your Roll Number is entered correctly. One Roll Number can only be registered with one Login ID. Duplicate registrations may be cancelled.
                                </p>
                                <p>Best regards,<br/>Etamax Team</p>
                            </div>
                        </div>
                    `
                });
            } else {
                console.log(`Criteria Not Met for Free Reg ${session.user.id}. Suppressing email.`);
            }
        }

        revalidatePath('/events');
        revalidatePath('/profile');
        revalidatePath(`/events/${eventId}`);

        const userRegs = await getUserRegistrationsAction();

        return {
            success: true,
            message: 'Registration successful! Redirecting to receipt...',
            registrationId: newReg._id.toString(),
            paymentMethod,
            registrations: userRegs.registrations || []
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

        // Sanitize formData for error return
        const safePayload: Record<string, string> = {};
        formData.forEach((value, key) => {
            if (typeof value === 'string') safePayload[key] = value;
        });
        return { error: errorMessage, payload: safePayload };
    }
}

export async function getRegistrationReceiptAction(regId: string) {
    try {
        await connectToDatabase();
        // (await import('@/models/Event')).default;
        // (await import('@/models/Slot')).default;
        // const Team = (await import('@/models/Team')).default;

        // 1. Fetch the specific registration requested
        const currentReg = await Registration.findById(regId).lean();
        if (!currentReg) return null;

        // 2. Fetch ALL registrations for this user
        const allRegs = await Registration.find({
            userId: currentReg.userId,
            status: { $ne: RegStatus.CANCELLED } // Exclude cancelled
        })
            .populate('eventId')
            .populate('slotId')
            .sort({ createdAt: -1 })
            .lean();

        // 3. Helper to serialize a single registration
        const serializeReg = async (reg: any) => {
            let teamData = null;
            if (reg.teamId) {
                // Efficiently fetch team info
                const team = await Team.findById(reg.teamId)
                    .populate('leaderId')
                    .populate('members.userId')
                    .lean();

                if (team) {
                    teamData = {
                        name: team.name,
                        code: team.code,
                        // @ts-ignore
                        leaderName: team.leaderId?.fullName || "Unknown",
                        members: team.members.map((m: any) => ({
                            // @ts-ignore
                            name: m.userId?.fullName || "Unknown",
                            // @ts-ignore
                            rollNumber: m.userId?.rollNumber || "N/A",
                            status: m.status
                        }))
                    };
                }
            }

            return {
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
                team: teamData,
                eventId: reg.eventId && typeof reg.eventId === 'object' && 'name' in reg.eventId ? {
                    // @ts-ignore
                    name: reg.eventId.name || null,
                    // @ts-ignore
                    price: reg.eventId.price || 0,
                    // @ts-ignore
                    type: reg.eventId.type || 'N/A',
                    // @ts-ignore
                    category: reg.eventId.category || 'N/A',
                } : null,
                slotId: reg.slotId && typeof reg.slotId === 'object' ? {
                    // @ts-ignore
                    startTime: reg.slotId.startTime,
                    // @ts-ignore
                    endTime: reg.slotId.endTime,
                    // @ts-ignore
                    venue: reg.slotId.venue || null,
                    // @ts-ignore
                    dayNumber: reg.slotId.dayNumber || null,
                } : null,
            };
        };

        // 4. Serialize all
        const serializedAll = await Promise.all(allRegs.map(r => serializeReg(r)));

        // Find serialized version of current reg
        const serializedCurrent = serializedAll.find(r => r._id === regId) || serializedAll[0];

        return {
            current: serializedCurrent,
            all: serializedAll
        };

    } catch (error) {
        console.error("Fetch Receipt Error:", error);
        return null;
    }
}

export async function updateRegistrationStatusAction(regId: string, newStatus: string) {
    try {
        const session = await getSession();
        const role = session?.role?.toUpperCase();
        if (!session || (role !== 'SUPER_ADMIN' && role !== 'CLUB_ADMIN')) {
            console.error("Update Status Unauthorized:", session?.role);
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        // const Registration = (await import('@/models/Registration')).default;
        // (await import('@/models/Event')).default;
        // (await import('@/models/Slot')).default;

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
            // const Team = (await import('@/models/Team')).default; // Dynamic import if needed
            const team = await Team.findById(updatedReg.teamId);

            if (team && team.leaderId.toString() === updatedReg.userId.toString()) {
                console.log(`Leader ${updatedReg.fullName} updated to ${newStatus}. Cascading to members...`);

                // 1. Update Team Members Payment Status
                const newPaymentStatus = newStatus === RegStatus.CONFIRMED ? 'PAID' : 'PENDING';
                const memberUserIds: string[] = [];

                team.members.forEach((m: any) => {
                    m.paymentStatus = newPaymentStatus;
                    memberUserIds.push(m.userId);
                });
                if (newStatus === RegStatus.CONFIRMED) {
                    team.status = TEAM_STATUS_CONFIRMED as any;
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
        if (newStatus === RegStatus.CONFIRMED && updatedReg.email && updatedReg.fullName) {
            if (process.env.EMAIL_USER && updatedReg.email) {
                console.log(`Sending approval email to: ${updatedReg.email}`);

                // --- Master Receipt Logic (Unified with Webhook) ---
                const { checkCriteria } = await import('@/lib/criteria');
                const { met: criteriaMet, pending } = await checkCriteria(updatedReg.userId.toString());

                console.log(`Criteria Check for ${updatedReg.userId}: ${criteriaMet ? 'MET' : 'PENDING'}`, pending);

                if (!criteriaMet) {
                    console.log(`Criteria Not Met for ${updatedReg.email}. Suppressing email.`);
                    return { success: true, newStatus };
                }

                // If criteria met, proceed to send Master Receipt
                const Registration = (await import('@/models/Registration')).default;
                const allConfirmedRegs = await Registration.find({
                    userId: updatedReg.userId,
                    status: 'CONFIRMED'
                })
                    .populate('eventId')
                    .populate('slotId')
                    .populate('teamId');

                let totalCost = 0;
                const eventRows = allConfirmedRegs.map((reg: any) => {
                    const evt = reg.eventId;
                    const slt = reg.slotId;
                    const price = evt?.price || 0;
                    totalCost += price;

                    let dateStr = 'TBD';
                    if (slt?.dayNumber) {
                        const dayMap: { [key: number]: string } = {
                            1: 'Feb 12',
                            2: 'Feb 13',
                            3: 'Feb 14'
                        };
                        dateStr = dayMap[slt.dayNumber] || `Day ${slt.dayNumber}`;
                    }

                    // Criteria met, so show link
                    // PRIORITIZE SLOT LINK -> EVENT LINK
                    const finalWaLink = slt?.whatsappLink || evt?.whatsappLink;

                    const waLink = finalWaLink
                        ? `<a href="${finalWaLink}" style="color: #25D366; text-decoration: none; font-weight: bold;">Join Group</a>`
                        : '<span style="color: #999;">-</span>';

                    return `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${evt?.name || 'Unknown'}</td>
                        <td style="padding: 10px;">${dateStr} <br/> <small>${slt?.startTime} - ${slt?.endTime}</small></td>
                        <td style="padding: 10px;">${waLink}</td>
                        <td style="padding: 10px; text-align: right;">₹${price}</td>
                    </tr>
                    `;
                }).join('');

                const criteriaMessage = `<div style="margin-top: 20px; padding: 15px; background-color: #f0fff4; border: 1px solid #b2f5ea; border-radius: 6px;">
                        <p style="margin: 0; font-size: 14px; color: #2e7d32;">
                            <strong>✅ Congratulations!</strong> You have fulfilled all participation criteria. Please join the WhatsApp groups above.
                        </p>
                       </div>`;

                await sendEmail({
                    to: updatedReg.email,
                    subject: `🎉 All Criteria Met! here is your Master Receipt ✅`,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                                <h1 style="margin: 0; font-size: 24px;">All Set! 🎉</h1>
                            </div>
                            <div style="padding: 20px;">
                                <p style="font-size: 16px;">Hello <strong>${updatedReg.fullName}</strong>,</p>
                                <p style="font-size: 16px;">Your registration status has been updated to <strong>CONFIRMED</strong>.</p>
                                <p style="font-size: 16px;">Here is your updated list of confirmed events:</p>
                                
                                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                                    <thead>
                                        <tr style="background-color: #f8f9fa; text-align: left;">
                                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Event</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Date/Time</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">WhatsApp</th>
                                            <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${eventRows}
                                        <tr style="font-weight: bold; background-color: #f8f9fa;">
                                            <td colspan="3" style="padding: 10px; text-align: right;">Total Paid:</td>
                                            <td style="padding: 10px; text-align: right;">₹${totalCost}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                ${criteriaMessage}
                                <br />
                                <p style="font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                                    <strong>Disclaimer:</strong> Please ensure your Roll Number is entered correctly. One Roll Number can only be registered with one Login ID. Duplicate registrations may be cancelled.
                                </p>
                                <p>Best regards,<br/>Etamax Team</p>
                            </div>
                        </div>
                    `,
                });
            }

        }

        return { success: true, newStatus };
    } catch (error) {
        console.error('Update Status Error:', error);
        return { error: 'Failed to update status' };
    }
}

export async function cancelRegistrationAction(regId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        await connectToDatabase();
        // const Registration = (await import('@/models/Registration')).default;
        // const Slot = (await import('@/models/Slot')).default;
        // const Team = (await import('@/models/Team')).default;

        const reg = await Registration.findById(regId);
        if (!reg) return { error: 'Registration not found' };

        // Authorization: User owns reg OR Admin
        const isAdmin = session.role === 'SUPER_ADMIN' || session.role === 'CLUB_ADMIN';
        if (reg.userId.toString() !== session.user.id && !isAdmin) {
            return { error: 'You can only cancel your own registrations.' };
        }

        if (reg.status === RegStatus.CANCELLED) {
            return { error: 'Already cancelled.' };
        }

        // Logic: Mark Cancelled
        reg.status = RegStatus.CANCELLED;
        await reg.save();

        // Decrement Slot Count
        await Slot.findByIdAndUpdate(reg.slotId, { $inc: { registeredCount: -1 } });

        // If Team Event: Handle Team Logic?
        // If Leader cancels, do we dissolve team? Or just remove member?
        // Prompt says "remove his participation".
        // If Team Event: Handle Team Logic
        if (reg.teamId) {
            const team = await Team.findById(reg.teamId);
            if (team) {
                // Check if user is the LEADER
                if (team.leaderId.toString() === reg.userId.toString()) {
                    console.log(`Leader ${reg.userId} cancelling. Dissolving team ${team._id}...`);

                    // 1. Mark Team as Cancelled
                    team.status = 'CANCELLED' as any; // Or EXPIRED? CANCELLED seems best.
                    await team.save();

                    // 2. Decrement TEAMS count from slot
                    await Slot.findByIdAndUpdate(reg.slotId, { $inc: { teamsCount: -1 } });

                    // 3. Cancel ALL registrations for this team (including the leader's which is already done above, but good to be safe/consistent)
                    // We already set reg.status = CANCELLED above. Now do others.
                    const memberRegs = await Registration.find({ teamId: team._id, status: { $ne: RegStatus.CANCELLED }, _id: { $ne: reg._id } });

                    for (const memberReg of memberRegs) {
                        memberReg.status = RegStatus.CANCELLED;
                        await memberReg.save();
                        // Also decrement registeredCount for each member
                        await Slot.findByIdAndUpdate(memberReg.slotId, { $inc: { registeredCount: -1 } });
                    }
                    console.log(`Dissolved team and cancelled ${memberRegs.length} other members.`);

                } else {
                    // Just a member
                    console.log(`Member ${reg.userId} leaving team ${team._id}...`);
                    team.members = team.members.filter((m: any) => m.userId.toString() !== reg.userId.toString());
                    await team.save();

                    // Note: registeredCount was ALREADY decremented at the top of this function.
                    // We don't decrement teamsCount because the team still exists.
                }
            }
        } else {
            // Solo logic covered by registeredCount
        }

        revalidatePath('/events');
        revalidatePath('/profile');

        return { success: true, message: 'Registration cancelled.' };

    } catch (error) {
        console.error("Cancel Error:", error);
        return { error: 'Failed to cancel registration.' };
    }
}

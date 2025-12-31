'use server';

import { z } from 'zod';
import { getSession } from '@/lib/auth';
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
            const messages = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
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

        // 3. Check for existing registration
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

        // 4. Create Registration
        const newReg = await Registration.create({
            userId: session.user.id,
            eventId,
            slotId,
            fullName,
            rollNumber,
            email,
            branch,
            semester,
            status: paymentMethod === 'OFFLINE' ? RegStatus.PENDING : RegStatus.CONFIRMED,
        });

        // 6. Send Email Receipt
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            console.log(`Attempting to send email to ${email} from ${process.env.EMAIL_USER}`);

            let transporter;
            try {
                // Re-initialize transporter here to pick up latest env vars
                transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });
            } catch (createTransportError) {
                console.error("Failed to create email transporter:", createTransportError);
                // Optionally, you might want to return an error here or just log and continue
                // For now, we'll just log and let the sendMail catch handle it if transporter is undefined
            }

            if (transporter) {
                try {
                    await transporter.sendMail({
                        from: '"Etamax 2026" <' + process.env.EMAIL_USER + '>',
                        to: email,
                        subject: `Registration Confirmed: ${event.name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; color: #333;">
                                <h1>Registration Successful!</h1>
                                <p>Hi ${fullName},</p>
                                <p>You have successfully registered for <strong>${event.name}</strong>.</p>
                                <hr />
                                <p><strong>Event Details:</strong></p>
                                <ul>
                                    <li><strong>Event:</strong> ${event.name}</li>
                                    <li><strong>Venue:</strong> ${slot.venue}</li>
                                    <li><strong>Day:</strong> Day ${slot.dayNumber}</li>
                                    <li><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</li>
                                    <li><strong>Branch:</strong> ${branch}</li>
                                    <li><strong>Semester:</strong> ${semester}</li>
                                </ul>
                                <p><strong>Status:</strong> ${paymentMethod === 'OFFLINE' ? 'Pending Payment (Offline)' : 'Confirmed'}</p>
                                <p>Please show this email at the entry.</p>
                                <br />
                                <p>Best regards,<br/>Etamax Team</p>
                            </div>
                        `,
                    });
                    console.log("Email sent successfully.");
                } catch (emailError) {
                    console.error("Failed to send email:", emailError);
                }
            } else {
                console.error("Email transporter not initialized, skipping email sending.");
            }
        } else {
            console.log("Skipping email: Creds not found in process.env");
        }

        return {
            success: true,
            message: 'Registration successful! Redirecting to receipt...',
            registrationId: newReg._id.toString()
        };

    } catch (error: any) {
        console.error('Registration Error Full Object:', JSON.stringify(error, null, 2));
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val: any) => val.message);
            return { error: `Validation Failed: ${messages.join(', ')}`, payload: Object.fromEntries(formData) };
        }
        return { error: error.message || 'Internal Server Error', payload: Object.fromEntries(formData) };
    }
}

export async function getRegistrationReceiptAction(regId: string) {
    try {
        await connectToDatabase();
        const reg = await Registration.findById(regId)
            .populate('eventId')
            .populate('slotId')
            .lean();

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
            createdAt: reg.createdAt ? reg.createdAt.toISOString() : null,
            updatedAt: reg.updatedAt ? reg.updatedAt.toISOString() : null,
            // Manual population serialization
            eventId: reg.eventId && typeof reg.eventId === 'object' && 'name' in reg.eventId ? {
                // @ts-ignore
                name: reg.eventId.name || null,
                // @ts-ignore
                price: reg.eventId.price || 0,
                // @ts-ignore
                _id: reg.eventId._id ? reg.eventId._id.toString() : null
            } : null,
            slotId: reg.slotId && typeof reg.slotId === 'object' && 'venue' in reg.slotId ? {
                // @ts-ignore
                startTime: reg.slotId.startTime ? new Date(reg.slotId.startTime).toISOString() : null,
                // @ts-ignore
                endTime: reg.slotId.endTime ? new Date(reg.slotId.endTime).toISOString() : null,
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

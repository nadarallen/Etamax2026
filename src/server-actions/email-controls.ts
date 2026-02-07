'use server';

import { getSession, Role } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Registration, { RegStatus } from '@/models/Registration';
import User from '@/models/User';
import Team from '@/models/Team';
import Event from '@/models/Event';
import Slot from '@/models/Slot';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function resendConfirmationEmailAction(regId: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();

        const reg = await Registration.findById(regId).populate('eventId').populate('slotId');
        if (!reg) return { error: 'Registration not found' };

        if (reg.status !== RegStatus.CONFIRMED) {
            return { error: 'Registration is not confirmed. Cannot send confirmation email.' };
        }

        // --- Master Receipt Logic (Reused) ---
        // We can optionally force bypass criteria check if admin explicitly requests "Resend",
        // but it's safer to ensure they still meet criteria to avoid confusion.
        // However, if they are CONFIRMED, they *should* have met criteria or were manually confirmed.
        // Let's send the email regardless of current criteria state if status is CONFIRMED, 
        // as the admin is explicitly requesting it.

        const allConfirmedRegs = await Registration.find({
            userId: reg.userId,
            status: 'CONFIRMED'
        })
            .populate('eventId')
            .populate('slotId')
            .populate('teamId');

        let totalCost = 0;
        const eventRows = allConfirmedRegs.map((r: any) => {
            const evt = r.eventId;
            const slt = r.slotId;
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

            const finalWaLink = slt?.whatsappLink;
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
                    <strong>✅ Confirmation Resent</strong> This is a copy of your Master Receipt.
                </p>
               </div>`;

        if (!reg.email) return { error: 'User email not found on registration' };

        const emailResult = await sendEmail({
            to: reg.email,
            subject: `✅ (Resent) Master Receipt & Confirmation`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">Confirmation Receipt</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p style="font-size: 16px;">Hello <strong>${reg.fullName}</strong>,</p>
                        <p style="font-size: 16px;">Here is a copy of your confirmed events registration details.</p>
                        
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
                        <p>Best regards,<br/>Etamax Team</p>
                    </div>
                </div>
            `,
        });

        if (emailResult.success) {
            return { success: true, message: 'Confirmation email resent.' };
        } else {
            return { error: 'Failed to send email provider.' };
        }

    } catch (error: any) {
        console.error('Resend Confirmation Error:', error);
        return { error: error.message || 'Internal logic error' };
    }
}

export async function resendPasswordEmailAction(userId: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.CLUB_ADMIN)) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();

        const user = await User.findById(userId);
        if (!user) return { error: 'User not found' };

        // 1. Generate NEW Password
        const { customAlphabet } = await import('nanoid');
        const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
        const newPassword = nanoid();

        // 2. Hash and Update
        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = passwordHash;
        user.generatedPassword = newPassword; // Optional: Keep track of last generated? Or we can omit this field updates if we don't want to store it. Ideally we shouldn't store it but the schema has it.
        await user.save();

        // 3. Send Email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2196F3; text-align: center;">Etamax Account Password Reset</h2>
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                    <p style="margin: 5px 0;"><strong>New Password:</strong> ${newPassword}</p>
                </div>
                <p style="font-size: 14px; color: #666;">An admin has reset your password. Please use these credentials to login.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://etamax2026.in/login" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
                </div>
            </div>
        `;

        const emailResult = await sendEmail({
            to: user.email,
            subject: 'Etamax 2026 - Password Reset',
            html: emailHtml,
        });

        if (emailResult.success) {
            return { success: true, message: `Password reset and sent to ${user.email}` };
        } else {
            return { error: 'Failed to send email.' };
        }

    } catch (error: any) {
        console.error('Resend Password Error:', error);
        return { error: error.message || 'Internal logic error' };
    }
}

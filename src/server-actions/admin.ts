'use server';

import connectToDatabase from '@/lib/db';
import Payment, { PaymentStatus } from '@/models/Payment';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
// In real app, we would import the same logic as Webhook (Team update, Slot decrement) 
// For demo, we will just mark as SUCCESS to prove point, assuming Admin does manual slot management or logic is shared.
// SHARED LOGIC SHOULD BE EXTRACTED TO A SERVICE (Prompt 2).
import Event from '@/models/Event';
import Team, { TeamStatus, PaymentStatus as TeamPaymentStatus } from '@/models/Team';

// REUSING WEBHOOK LOGIC (Ideally extract this function)
async function fulfillPayment(payment: any) {
    const { userId, eventId, slotId, teamId } = payment.metadata;

    if (teamId) {
        const team = await Team.findById(teamId);
        if (team) {
            const member = team.members.find((m: any) => m.userId.toString() === userId.toString());
            if (member) {
                member.paymentStatus = TeamPaymentStatus.PAID;
                await team.save();
            }
            // Check if all paid
            const allPaid = team.members.every((m: any) => m.paymentStatus === TeamPaymentStatus.PAID);
            if (allPaid && team.members.length >= (await Event.findById(eventId))!.minTeamSize) {
                team.status = TeamStatus.CONFIRMED;
                await Event.updateOne(
                    { 'slots._id': slotId },
                    { $inc: { 'slots.$.bookedCount': team.members.length } }
                );
                await team.save();
            }
        }
    } else {
        await Event.updateOne(
            { 'slots._id': slotId },
            { $inc: { 'slots.$.bookedCount': 1 } }
        );
    }
}

export async function approvePaymentAction(formData: FormData) {
    const paymentId = formData.get('paymentId');
    await connectToDatabase();

    const payment = await Payment.findById(paymentId);
    if (!payment) return; // Silent return or throw new Error("Not Found")

    payment.status = PaymentStatus.SUCCESS;
    await payment.save();

    // Trigger Side Effects
    await fulfillPayment(payment);

    revalidatePath('/admin/approvals');
}

export async function rejectPaymentAction(formData: FormData) {
    const paymentId = formData.get('paymentId');
    await connectToDatabase();

    await Payment.findByIdAndUpdate(paymentId, { status: PaymentStatus.FAILED });
    revalidatePath('/admin/approvals');
}

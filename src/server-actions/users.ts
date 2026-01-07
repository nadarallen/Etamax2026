'use server';

import connectToDatabase from '@/lib/db';
import User from '@/models/User'; // Assuming User model exists
import { getSession, Role } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Fetch users for the table
export async function getUsersAction() {
    const session = await getSession();
    if (session?.role !== Role.SUPER_ADMIN) return [];

    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    return JSON.parse(JSON.stringify(users)); // Serialize
}

// Direct Form Action (No formatting state needed for simple delete)
export async function deleteUserAction(formData: FormData) {
    const session = await getSession();
    if (session?.role !== Role.SUPER_ADMIN) return;

    const userId = formData.get('userId');
    if (!userId) return;

    // Safety: Don't delete self
    if (userId === session.user.id) return; // Cannot delete self

    try {
        await connectToDatabase();
        await User.findByIdAndDelete(userId);
        revalidatePath('/admin/users');
    } catch (error) {
        console.error("Delete User Error:", error);
    }
}

export async function updateUserRoleAction(formData: FormData) {
    const session = await getSession();
    if (session?.role !== Role.SUPER_ADMIN) return;

    const userId = formData.get('userId');
    const newRole = formData.get('role');

    if (userId === session.user.id) return;

    try {
        await connectToDatabase();
        await User.findByIdAndUpdate(userId, { role: newRole });
        revalidatePath('/admin/users');
    } catch (e) {
        // silent fail
    }
}

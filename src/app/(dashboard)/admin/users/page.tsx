import { getUsersAction, deleteUserAction, updateUserRoleAction } from '@/server-actions/users';
import { Role } from '@/lib/auth';
import { Trash2, Shield } from 'lucide-react';
import Link from 'next/link';

// Simple Form Component for Delete Button
function DeleteUserButton({ userId }: { userId: string }) {
    return (
        <form action={deleteUserAction} className="inline-block"
            onSubmit={(e) => { if (!confirm('Are you sure? This action is irreversible.')) e.preventDefault(); }}>
            <input type="hidden" name="userId" value={userId} />
            <button type="submit" className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition">
                <Trash2 className="w-4 h-4" />
            </button>
        </form>
    );
}

function RoleSelect({ userId, currentRole }: { userId: string, currentRole: string }) {
    return (
        <form action={updateUserRoleAction} className="inline-block">
            <input type="hidden" name="userId" value={userId} />
            <select
                name="role"
                defaultValue={currentRole}
                onChange={(e) => e.target.form?.requestSubmit()}
                className="bg-gray-800 text-xs text-white border border-gray-700 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
            >
                {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </form>
    );
}

export default async function AdminUsersPage() {
    const users = await getUsersAction();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">User Management</h1>
                <Link href="/admin" className="text-sm text-gray-400 hover:text-white">Back to Dashboard</Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800 text-gray-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {users.map((user: any) => (
                            <tr key={user._id} className="hover:bg-gray-800/50 transition">
                                <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <RoleSelect userId={user._id} currentRole={user.role} />
                                </td>
                                <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <DeleteUserButton userId={user._id} />
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

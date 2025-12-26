import Link from 'next/link';
import { logoutAction } from '@/server-actions/auth';
import { getSession, Role } from '@/lib/auth';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    const userRole = session?.role;

    return (
        <div className="flex min-h-screen bg-gray-900 text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-800 bg-gray-900 p-6 hidden md:block fixed h-full">
                <div className="mb-8 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-600"></div>
                    <span className="text-xl font-bold tracking-tight">Etamax</span>
                </div>

                <nav className="space-y-1">
                    {userRole === Role.STUDENT && (
                        <>
                            <Link href="/student" className="flex items-center gap-3 rounded-lg bg-gray-800 px-3 py-2 text-white transition hover:bg-gray-700">
                                <span className="w-5 h-5 flex items-center justify-center">📅</span> Events
                            </Link>
                            <Link href="/student/my-teams" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition hover:bg-gray-800 hover:text-white">
                                <span className="w-5 h-5 flex items-center justify-center">🤝</span> My Teams
                            </Link>
                        </>
                    )}

                    {userRole === Role.CLUB_ADMIN && (
                        <>
                            <Link href="/club" className="flex items-center gap-3 rounded-lg bg-gray-800 px-3 py-2 text-white transition hover:bg-gray-700">
                                <span className="w-5 h-5 flex items-center justify-center">🎮</span> My Events
                            </Link>
                        </>
                    )}

                    {userRole === Role.SUPER_ADMIN && (
                        <>
                            <Link href="/admin" className="flex items-center gap-3 rounded-lg bg-gray-800 px-3 py-2 text-white transition hover:bg-gray-700">
                                <span className="w-5 h-5 flex items-center justify-center">⚡</span> Master View
                            </Link>
                            <Link href="/admin/approvals" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition hover:bg-gray-800 hover:text-white">
                                <span className="w-5 h-5 flex items-center justify-center">📝</span> Approvals
                            </Link>
                            <Link href="/club" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition hover:bg-gray-800 hover:text-white">
                                <span className="w-5 h-5 flex items-center justify-center">ℹ️</span> Club View (Debug)
                            </Link>
                        </>
                    )}
                </nav>

                <div className="absolute bottom-6 left-6 w-52">
                    <form action={logoutAction}>
                        <button className="w-full rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
                            Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 bg-gray-950 min-h-screen">
                <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-800 bg-gray-900/80 px-6 backdrop-blur">
                    <h1 className="text-lg font-semibold">Dashboard</h1>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

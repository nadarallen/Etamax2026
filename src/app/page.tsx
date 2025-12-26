import Link from 'next/link';
import { Rocket, Shield, Users } from 'lucide-react';
import { getSession, Role } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Smart Routing: Redirect if logged in
  const session = await getSession();
  if (session) {
    if (session.role === Role.SUPER_ADMIN) redirect('/admin');
    if (session.role === Role.CLUB_ADMIN) redirect('/club');
    if (session.role === Role.STUDENT) redirect('/student');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 text-white">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 absolute inset-0 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl text-center space-y-8">
        <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-full ring-1 ring-white/10 mb-4 animate-pulse">
          <Rocket className="w-8 h-8 text-blue-400 mr-2" />
          <span className="text-xl font-bold tracking-widest text-blue-200">ETAMAX 2025</span>
        </div>

        <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
          THE FUTURE<br />IS HERE
        </h1>

        <p className="text-xl text-gray-400 max-w-lg mx-auto leading-relaxed">
          Experience the ultimate college fest platform. Register for events, create teams, and compete for glory.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href="/login" className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition border border-gray-700 flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" /> Administrative Login
          </Link>
          <Link href="/register" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2">
            <Users className="w-5 h-5" /> Student Registration
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-3 gap-8 text-center border-t border-gray-800">
          <div>
            <p className="text-3xl font-bold text-white">50+</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Events</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">2K+</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Students</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">₹1L</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Prizes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

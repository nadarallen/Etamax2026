'use client';

import StudentAnalyticsView from '@/components/StudentAnalyticsView';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ClubStudentsPage() {
    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/club">
                    <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-widest">
                        STUDENT ANALYTICS
                    </h1>
                    <p className="text-gray-400">Track participation criteria and registrations by department</p>
                </div>
            </div>

            <StudentAnalyticsView />
        </div>
    );
}

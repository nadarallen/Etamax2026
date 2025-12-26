import CreateEventForm from '@/components/forms/CreateEventForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateEventPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href="/club" className="text-gray-400 hover:text-white flex items-center mb-4 transition">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-white">Create New Event</h1>
                <p className="text-gray-400 mt-2">Set up the basics. You can add time slots later.</p>
            </div>

            <CreateEventForm />
        </div>
    );
}

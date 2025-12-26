import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import { Calendar, MapPin, Info, Users, AlertCircle } from 'lucide-react';
import SlotGrid from '@/components/features/SlotGrid';

// Prompt 29: Static Shell generation (if we used generateStaticParams)
// For now, we rely on standard dynamic rendering for simplicity in demo
export default async function EventDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    await connectToDatabase();

    const event = await Event.findById(id).select('-slots'); // Don't fetch slots here, we fetch them fresh in the suspended component

    if (!event) {
        notFound();
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl mb-8">
                <div className="h-48 md:h-64 bg-gradient-to-r from-blue-900 to-indigo-900"></div>
                <div className="p-8 relative">
                    <div className="absolute -top-12 left-8 h-24 w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-indigo-900">
                        {event.title.charAt(0)}
                    </div>

                    <div className="mt-12 md:mt-0 md:ml-32">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                                <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                                    <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {event.minTeamSize}-{event.maxTeamSize} Members</span>
                                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> Main Auditorium</span>
                                    <span className="flex items-center text-green-400 font-semibold">₹ {event.price} / person</span>
                                </div>
                            </div>
                            <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Type</span>
                                <p className="text-white font-medium">{event.eventType}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Description */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                        <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
                            <Info className="w-5 h-5 mr-2 text-blue-500" /> About Event
                        </h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>
                    </section>
                </div>

                {/* Right Col: Booking (Slot Selector) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl">
                            <h3 className="text-white font-semibold text-lg mb-6 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-yellow-500" /> Select Session
                            </h3>

                            {/* Suspense Boundary for Slot Availability (Prompt 8 & 29) */}
                            <Suspense fallback={<SlotGridSkeleton />}>
                                <SlotGrid eventId={id} eventType={event.eventType} />
                            </Suspense>

                            <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-900/50 text-xs text-blue-200 flex items-start">
                                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                <p>Selection is tentative. Your spot is secured only after payment for Solo, or Leader confirmation for Teams.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SlotGridSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="h-12 bg-gray-800 rounded-lg w-full"></div>
            <div className="h-12 bg-gray-800 rounded-lg w-full"></div>
            <div className="h-12 bg-gray-800 rounded-lg w-full"></div>
        </div>
    );
}

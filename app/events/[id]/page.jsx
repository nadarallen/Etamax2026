'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import eventsData from '@/data/events.json';
import { ArrowLeft, Calendar, MapPin, Users, Trophy } from 'lucide-react';

export default function EventDetail() {
    const params = useParams();
    const event = eventsData.find(e => e.id === params.id);

    if (!event) return <div className="text-white pt-20 text-center">Event not found</div>;

    return (
        <div className="min-h-screen pt-10 pb-20 px-4 max-w-4xl mx-auto relative">
            <Link href="/events" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back to Events
            </Link>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <span className="text-galaxy-accent font-bold tracking-wider text-sm uppercase">{event.schedule.category} Event</span>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2 mb-4">{event.name}</h1>
                    </div>
                    <div className="bg-galaxy-purple/20 border border-galaxy-purple text-galaxy-purple px-4 py-2 rounded-lg text-xl font-bold">
                        ₹{event.price}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 text-gray-300">
                    <div className="flex flex-col items-center p-4 bg-black/20 rounded-xl">
                        <Calendar className="mb-2 text-galaxy-accent" />
                        <span className="text-sm font-bold">Day {event.schedule.dayNumber}</span>
                        <span className="text-xs">{event.schedule.timing}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-black/20 rounded-xl">
                        <MapPin className="mb-2 text-galaxy-accent" />
                        <span className="text-sm font-bold">Venue</span>
                        <span className="text-xs">{event.schedule.venue}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-black/20 rounded-xl">
                        <Users className="mb-2 text-galaxy-accent" />
                        <span className="text-sm font-bold">Type</span>
                        <span className="text-xs capitalize">{event.type}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-black/20 rounded-xl">
                        <Trophy className="mb-2 text-galaxy-accent" />
                        <span className="text-sm font-bold">Prize Pool</span>
                        <span className="text-xs">{event.prizePool}</span>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none mb-12">
                    <h3 className="text-2xl font-bold text-white mb-4">Description</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">{event.description}</p>
                </div>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-galaxy-dark/80 backdrop-blur-md border-t border-white/10 md:relative md:bg-transparent md:border-t-0 md:p-0">
                    <Link href={`/register/${event.id}`}>
                        <button className="w-full btn-primary py-4 text-xl shadow-galaxy-purple/50 shadow-lg">
                            Proceed Included
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

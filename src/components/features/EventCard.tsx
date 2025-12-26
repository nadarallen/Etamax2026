import { Calendar, Users, IndianRupee } from "lucide-react";
import Link from 'next/link';
import { IEvent } from "@/models/Event"; // Assuming type sharing strategies
import { formatCurrency } from "@/lib/utils";

// Using a partial type for the card props to match what we actually select
type EventCardProps = {
    event: any; // In real app, pick specific fields from IEvent
};

export function EventCard({ event }: EventCardProps) {
    const isSellingFast = event.slots[0]?.bookedCount > event.slots[0]?.capacity * 0.8;

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 transition hover:border-gray-700 hover:shadow-2xl">
            {/* Image Placeholder */}
            <div className="h-40 w-full bg-gradient-to-br from-indigo-800 to-purple-900 group-hover:scale-105 transition-transform duration-500"></div>

            <div className="flex flex-1 flex-col p-5">
                <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                        {event.eventType}
                    </span>
                    {isSellingFast && (
                        <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-400 animate-pulse">
                            Selling Fast
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {event.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {event.description}
                </p>

                <div className="mt-auto space-y-3">
                    <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>{new Date(event.slots[0]?.startTime).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-400">
                            <Users className="mr-2 h-4 w-4" />
                            <span>{event.minTeamSize === 1 ? 'Solo' : `${event.minTeamSize}-${event.maxTeamSize} Members`}</span>
                        </div>
                        <div className="flex items-center font-semibold text-white">
                            <IndianRupee className="h-4 w-4" />
                            <span>{event.price}</span>
                        </div>
                    </div>

                    <Link
                        href={`/student/events/${event._id}`}
                        className="block w-full rounded-lg bg-white py-2.5 text-center text-sm font-semibold text-black transition hover:bg-gray-200"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}

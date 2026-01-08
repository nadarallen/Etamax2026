'use client';

import Link from 'next/link';
import { Users, Trophy, Wallet, Trash2 } from 'lucide-react';
import { deleteEventAction } from '@/server-actions/events';
import { useRouter } from 'next/navigation';

export default function EventCard({ event, activeDay, isAdmin = false }) {
    const router = useRouter();
    const isTeamEvent = event.type === 'duo' || event.type === 'group';

    // If activeDay is provided and we have slots, filter stats for that day
    let registered = event.stats?.totalRegistered || 0;
    let capacity = event.stats?.totalCapacity || 0;
    let slotsCount = event.stats?.slotsCount || 0;

    // Check if we have day-specific slots data
    if (activeDay && event.slots && event.slots.length > 0) {
        const daySlots = event.slots.filter(s => s.dayNumber === activeDay);
        if (daySlots.length > 0) {
            capacity = daySlots.reduce((acc, s) => acc + s.maxCapacity, 0);
            registered = daySlots.reduce((acc, s) => acc + (s.registeredCount || 0), 0);
            // Calculate day-specific team count
            if (isTeamEvent) {
                // Sum of teamsCount (from slots) for this day
                // Note: This assumes teams don't span slots in a way that double counts, 
                // but usually a team takes 1 slot.
                const dayTeams = daySlots.reduce((acc, s) => acc + (s.teamsCount || 0), 0);
                // Override the global team count with this day's count
                event.stats = { ...event.stats, totalTeams: dayTeams };
            }
            slotsCount = daySlots.length;
        }
    }



    // Determine the count to compare against capacity
    // For Team events, we must use the team count, not the registered members count.
    // We now update event.stats.totalTeams dynamically above if activeDay is present.
    let countToCheck = registered;
    if (isTeamEvent) {
        countToCheck = event.stats?.totalTeams || 0;
    }

    const percentFull = capacity > 0 ? (countToCheck / capacity) * 100 : 0;

    let statusText = 'Available';
    let statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
    let enrollText = 'Enroll Now';
    let isFull = false;

    if (capacity > 0 && countToCheck >= capacity) {
        statusText = 'Sold Out';
        statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
        enrollText = 'Full';
        isFull = true;
    } else if (percentFull >= 80) {
        statusText = 'Filling Fast';
        statusColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    } else if (capacity === 0 && slotsCount === 0) {
        statusText = 'Coming Soon';
        statusColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }

    const isFree = event.price == 0 || !event.price;

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you certain you want to delete this event? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await deleteEventAction(event._id); // Assuming event passed has _id
            if (res.success) {
                // Refresh to show it's gone
                router.refresh();
            } else {
                alert(res.error || 'Failed to delete event');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during deletion');
        }
    };

    return (
        <div className="relative h-full group">
            <Link href={`/events/${event.id || event.eventId}${activeDay ? `?day=${activeDay}` : ''}`} className="absolute inset-0 z-10 block" aria-label={`View ${event.name}`}>
                {/* Overlay Link */}
            </Link>

            {isAdmin && (
                <button
                    onClick={handleDelete}
                    className="absolute top-4 right-4 z-20 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-lg backdrop-blur-md transition-all duration-200"
                    title="Delete Event"
                >
                    <Trash2 size={18} />
                </button>
            )}

            <div className={`bg-white/5 backdrop-blur-xl border border-[#B3B8E6]/20 group-hover:border-[#7B5CFF]/50 rounded-3xl p-6 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 pointer-events-none ${isFull ? 'opacity-75 grayscale-[0.5]' : ''}`}>

                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#7B5CFF] to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>

                <div className="relative z-0 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-12"> {/* Added padding right to avoid overlap with Delete button */}
                            {/* Replaced Type with Name first, type moved below */}
                            <h3 className="text-2xl font-bold text-white leading-tight mb-1">{event.name}</h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{event.type} Event</span>
                        </div>
                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase whitespace-nowrap ${statusColor}`}>
                            {statusText}
                        </span>
                    </div>

                    <div className="flex-1 space-y-4 mb-8 mt-2">
                        {/* Live Counter */}
                        <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                            <div className="w-8 h-8 rounded-full bg-[#7B5CFF]/20 flex items-center justify-center text-[#7B5CFF]">
                                <Users size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className={isFull ? "text-red-400 font-bold" : "text-white font-bold"}>
                                    {event.type === 'solo' ? (
                                        `${registered} / ${capacity} Members Registered`
                                    ) : (
                                        `${event.stats?.totalTeams || 0} / ${capacity} Teams Registered`
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                            <div className="w-8 h-8 rounded-full bg-[#7B5CFF]/20 flex items-center justify-center text-[#7B5CFF]">
                                <Wallet size={16} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Entry:</span>
                                {isFree ? (
                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-bold uppercase">Free</span>
                                ) : (
                                    <strong className="text-white">₹{event.price}</strong>
                                )}
                            </div>
                        </div>

                        {event.prizePool && event.prizePool !== '0' && (
                            <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                                <div className="w-8 h-8 rounded-full bg-[#7B5CFF]/20 flex items-center justify-center text-[#7B5CFF]">
                                    <Trophy size={16} />
                                </div>
                                <span>Prize: <strong className="text-white">{/^\d+$/.test(event.prizePool) ? `₹${event.prizePool}` : event.prizePool}</strong></span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-auto">
                        <span className={`px-6 py-2 rounded-full font-medium shadow-[0_4px_10px_rgba(123,92,255,0.3)] transition-all duration-300 w-full text-center ${isFull ? 'bg-white/10 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#7B5CFF] text-white group-hover:shadow-[0_0_20px_rgba(123,92,255,0.6)] group-hover:scale-105'}`}>
                            {enrollText}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

import Link from 'next/link';
import { Users, Trophy, Wallet, MapPin } from 'lucide-react';

export default function EventCard({ event, activeDay }) {
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
            slotsCount = daySlots.length;
        }
    }

    return (
        <Link href={`/events/${event.id}`} className="block h-full group">
            <div className="bg-white/5 backdrop-blur-xl border border-[#B3B8E6]/20 group-hover:border-[#7B5CFF]/50 rounded-3xl p-6 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#7B5CFF] to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-bold text-white leading-tight">{event.name}</h3>
                        <span className="bg-[#7B5CFF]/20 text-[#B3B8E6] text-xs font-bold px-2 py-1 rounded-lg border border-[#7B5CFF]/30">
                            {event.type.toUpperCase()}
                        </span>
                    </div>

                    <div className="flex-1 space-y-4 mb-8">
                        {/* Live Counter */}
                        <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                            <div className="w-8 h-8 rounded-full bg-[#7B5CFF]/20 flex items-center justify-center text-[#7B5CFF]">
                                <Users size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold">{registered} / {capacity}</span>
                                <span className="text-xs text-gray-500">Registered</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                            <div className="w-8 h-8 rounded-full bg-[#7B5CFF]/20 flex items-center justify-center text-[#7B5CFF]">
                                <Wallet size={16} />
                            </div>
                            <span>Entry: <strong className="text-white">{event.price == 0 || !event.price ? 'Free' : `₹${event.price}`}</strong></span>
                        </div>

                        {event.prizePool && event.prizePool !== '0' && (
                            <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                                <div className="w-8 h-8 rounded-full bg-[#7B5CFF]/20 flex items-center justify-center text-[#7B5CFF]">
                                    <Trophy size={16} />
                                </div>
                                <span>Prize: <strong className="text-white">{event.prizePool}</strong></span>
                            </div>
                        )}

                        {slotsCount > 0 ? (
                            <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                                <div className="w-8 h-8 rounded-full bg-[#7B5CFF]/20 flex items-center justify-center text-[#7B5CFF]">
                                    <MapPin size={16} />
                                </div>
                                <span>{slotsCount} Slot{slotsCount > 1 ? 's' : ''} Available</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-sm text-yellow-500/80">
                                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                    <MapPin size={16} />
                                </div>
                                <span>Coming Soon</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-auto">
                        <span className="bg-[#7B5CFF] text-white px-6 py-2 rounded-full font-medium shadow-[0_4px_10px_rgba(123,92,255,0.3)] group-hover:shadow-[0_0_20px_rgba(123,92,255,0.6)] group-hover:scale-105 transition-all duration-300 w-full text-center">
                            Enroll Now
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

import Link from 'next/link';

export default function EventCard({ event }) {
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-[#B3B8E6]/20 hover:border-[#7B5CFF]/50 rounded-3xl p-6 flex flex-col justify-between h-full relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#7B5CFF] to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* TOP: Title */}
                <h3 className="text-2xl font-bold text-white mb-6 leading-tight">{event.name}</h3>

                {/* MIDDLE: Details List */}
                <div className="flex-1 space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                        <span className="w-2 h-2 rounded-full bg-[#7B5CFF] shrink-0"></span>
                        <span>{event.schedule.timing}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                        <span className="w-2 h-2 rounded-full bg-[#7B5CFF] shrink-0"></span>
                        <span>{event.schedule.venue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                        <span className="w-2 h-2 rounded-full bg-[#7B5CFF] shrink-0"></span>
                        <span>Limit: {event.maxMembers}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                        <span className="w-2 h-2 rounded-full bg-[#7B5CFF] shrink-0"></span>
                        <span>Entry: ₹{event.price}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#B3B8E6]">
                        <span className="w-2 h-2 rounded-full bg-[#7B5CFF] shrink-0"></span>
                        <span>Prize: {event.prizePool}</span>
                    </div>
                </div>

                {/* BOTTOM: Button */}
                <div className="flex justify-end mt-auto">
                    <Link href={`/events/${event.id}`}>
                        <button className="bg-[#7B5CFF] text-white px-6 py-2 rounded-full font-medium shadow-[0_4px_10px_rgba(123,92,255,0.3)] hover:shadow-[0_0_20px_rgba(123,92,255,0.6)] hover:scale-105 transition-all duration-300">
                            Enroll Now
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

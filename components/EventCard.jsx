import Link from 'next/link';

export default function EventCard({ event }) {
    return (
        <div className="card-glass p-6 flex flex-col justify-between h-full relative overflow-hidden group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-galaxy-purple to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{event.name}</h3>
                    <div className="flex items-center text-gray-300 text-sm mb-4 space-x-4">
                        <span>{event.schedule.timing}</span>
                        <span>|</span>
                        <span>{event.schedule.venue}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mb-6">
                        <div>
                            <span className="block text-xs uppercase text-gray-500">Price</span>
                            <span className="text-white font-medium">₹{event.price}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-gray-500">Prize</span>
                            <span className="text-galaxy-accent font-medium">{event.prizePool}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-gray-500">Type</span>
                            <span className="capitalize text-white">{event.type}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-gray-500">Limit</span>
                            <span>{event.maxMembers} Member(s)</span>
                        </div>
                    </div>
                </div>

                <Link href={`/events/${event.id}`}>
                    <button className="w-full btn-primary mt-auto">
                        Enroll Now
                    </button>
                </Link>
            </div>
        </div>
    );
}

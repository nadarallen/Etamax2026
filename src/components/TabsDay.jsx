export default function TabsDay({ activeDay, onChange }) {
    const days = [1, 2, 3];
    return (
        <div className="w-full">
            <div className="bg-white/5 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 flex">
                {days.map((day) => (
                    <button
                        key={day}
                        onClick={() => onChange(day)}
                        className={`flex-1 py-4 rounded-xl font-bold tracking-wider text-sm md:text-base transition-all duration-300 ${activeDay === day
                            ? 'bg-gradient-to-r from-galaxy-purple to-purple-600 text-white shadow-lg scale-[1.02]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        DAY {day}
                    </button>
                ))}
            </div>
        </div>
    );
}

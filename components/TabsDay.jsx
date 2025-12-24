export default function TabsDay({ activeDay, onChange }) {
    const days = [1, 2, 3];
    return (
        <div className="flex container mx-auto mb-8 bg-white/5 p-1 rounded-xl backdrop-blur-sm max-w-md">
            {days.map((day) => (
                <button
                    key={day}
                    onClick={() => onChange(day)}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all duration-300 ${activeDay === day
                            ? 'bg-galaxy-purple text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    DAY {day}
                </button>
            ))}
        </div>
    );
}

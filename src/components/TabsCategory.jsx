export default function TabsCategory({ activeCategory, onChange }) {
    const categories = ["Technical", "Cultural", "Seminar", "Sports"];
    return (
        <div className="w-full">
            <div className="flex gap-4 p-1">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onChange(cat)}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm md:text-base font-medium transition-all duration-300 border ${activeCategory === cat
                            ? 'bg-white/10 border-galaxy-purple/50 text-galaxy-accent shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                            : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function TabsCategory({ activeCategory, onChange }) {
    const categories = ["Technical", "Cultural", "Seminar"];
    return (
        <div className="flex justify-center space-x-6 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onChange(cat)}
                    className={`relative pb-2 text-lg font-medium transition-colors ${activeCategory === cat ? 'text-galaxy-accent' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    {cat}
                    {activeCategory === cat && (
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-galaxy-accent rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                    )}
                </button>
            ))}
        </div>
    );
}

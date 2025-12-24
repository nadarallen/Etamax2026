export default function FilterModal({ activeFilter, onFilterChange, isOpen, onClose }) {
    if (!isOpen) return null;

    const filters = ["All", "Solo", "Duo", "Group"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-galaxy-dark border border-white/10 rounded-2xl w-full max-w-sm p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    ✕
                </button>
                <h3 className="text-xl font-bold text-white mb-6">Filter Events</h3>

                <div className="flex flex-col space-y-3">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => {
                                onFilterChange(filter === "All" ? null : filter.toLowerCase());
                                onClose();
                            }}
                            className={`py-3 px-4 rounded-xl text-left font-medium transition-all ${(activeFilter === filter.toLowerCase() || (filter === "All" && activeFilter === null))
                                    ? 'bg-galaxy-purple text-white shadow-lg border border-galaxy-accent'
                                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                        >
                            {filter} Events
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

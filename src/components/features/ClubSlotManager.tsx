'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Users, Lock, ChevronRight } from 'lucide-react';

export function ClubSlotManager({ event }: { event: any }) {
    const [selectedSlot, setSelectedSlot] = useState<any>(null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Slot Grid (Calendar View Style) */}
            <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.slots.map((slot: any) => {
                        const isFull = slot.bookedCount >= slot.capacity;
                        const fillPercent = (slot.bookedCount / slot.capacity) * 100;
                        let statusColor = "bg-green-500";
                        if (fillPercent > 50) statusColor = "bg-yellow-500";
                        if (fillPercent > 90) statusColor = "bg-red-500";

                        return (
                            <div
                                key={slot._id}
                                onClick={() => setSelectedSlot(slot)}
                                className={cn(
                                    "cursor-pointer bg-gray-900 border rounded-xl p-4 transition-all hover:shadow-lg relative overflow-hidden group",
                                    selectedSlot?._id === slot._id ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-800 hover:border-gray-700"
                                )}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-lg font-bold text-white">
                                            {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center mt-1">
                                            <Clock className="w-3 h-3 mr-1" /> {new Date(slot.startTime).toDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full text-black", statusColor)}>
                                            {slot.bookedCount} / {slot.capacity}
                                        </span>
                                    </div>
                                </div>

                                {/* Visual Fill Bar at bottom */}
                                <div className="absolute bottom-0 left-0 h-1 bg-gray-800 w-full">
                                    <div className={cn("h-full transition-all duration-500", statusColor)} style={{ width: `${fillPercent}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Inspector Panel */}
            <div className="lg:col-span-1">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sticky top-24 shadow-xl">
                    {!selectedSlot ? (
                        <div className="text-center py-12 text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Select a slot to view details</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Session Details</h3>
                                <p className="text-sm text-gray-400">
                                    {new Date(selectedSlot.startTime).toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Capacity</span>
                                    <span className="text-white font-bold">{selectedSlot.capacity}</span>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Booked</span>
                                    <span className="text-white font-bold">{selectedSlot.bookedCount}</span>
                                </div>
                            </div>

                            <hr className="border-gray-800" />

                            <div>
                                <h4 className="font-bold text-white mb-4 flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-blue-500" /> Manifest
                                </h4>

                                {/* Placeholder for real Manifest List (Prompt 25) */}
                                <div className="text-center py-6 bg-gray-950 rounded-xl border border-dashed border-gray-800">
                                    <p className="text-sm text-gray-500">Manifest data would be fetched here.</p>
                                    <button className="mt-3 text-xs bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition">
                                        Load Participant List
                                    </button>
                                </div>
                            </div>

                            <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold text-sm flex items-center justify-center transition">
                                <Lock className="w-4 h-4 mr-2" /> Close Slot Manually
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPartyAction } from '@/server-actions/party';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock } from 'lucide-react';
import PaymentGateway from './PaymentGateway';

type Slot = {
    _id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    bookedCount: number;
};

export function SlotSelectionClient({ slots, eventId, eventType }: { slots: Slot[], eventId: string, eventType: string }) {
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    // Separate Handler for Team creation (Non-Payment)
    const handleTeamCreation = async () => {
        if (!selectedSlotId) return;
        setIsPending(true);

        try {
            const result = await createPartyAction(eventId, selectedSlotId);
            if (result.success) {
                router.push(`/student/party/${result.partyId}`);
            } else {
                alert(result.error);
            }
        } catch (e) {
            alert("Failed to create party");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {slots.map((slot) => {
                    const isFull = slot.bookedCount >= slot.capacity;
                    const isSellingFast = !isFull && slot.bookedCount >= slot.capacity * 0.8;
                    const isSelected = selectedSlotId === slot._id;

                    return (
                        <button
                            key={slot._id}
                            disabled={isFull}
                            onClick={() => setSelectedSlotId(slot._id)}
                            className={cn(
                                "w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden",
                                isFull ? "bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed" :
                                    isSelected ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/50" : "bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600"
                            )}
                        >
                            <div className="flex justify-between items-center z-10 relative">
                                <div>
                                    <p className={cn("font-bold text-lg", isSelected ? "text-white" : "text-gray-200")}>
                                        {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" /> {new Date(slot.startTime).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="text-right">
                                    {isFull ? (
                                        <span className="text-red-500 font-bold text-sm">FULL</span>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className={cn("font-medium text-sm", isSelected ? "text-blue-200" : "text-gray-400")}>
                                                {slot.capacity - slot.bookedCount} spots left
                                            </span>
                                            {isSellingFast && (
                                                <span className="text-orange-400 text-xs font-bold animate-pulse">Selling Fast</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selection Ring */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 text-white">
                                    <CheckCircle className="w-5 h-5 fill-blue-500 text-white" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {eventType === 'TEAM' ? (
                <button
                    onClick={handleTeamCreation}
                    disabled={!selectedSlotId || isPending}
                    className={cn(
                        "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all",
                        !selectedSlotId || isPending ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-yellow-400 text-black hover:bg-yellow-300 hover:shadow-yellow-400/20"
                    )}
                >
                    {isPending ? 'Creating Team...' : 'Create Team'}
                </button>
            ) : (
                /* Solo Payment Flow */
                <PaymentGateway
                    eventId={eventId}
                    slotId={selectedSlotId || ''}
                    onSuccess={() => alert("Registration Confirmed!")}
                >
                    {(handlePayment, isLoading) => (
                        <button
                            onClick={handlePayment}
                            disabled={!selectedSlotId || isLoading}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all",
                                !selectedSlotId || isLoading ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-yellow-400 text-black hover:bg-yellow-300 hover:shadow-yellow-400/20"
                            )}
                        >
                            {isLoading ? 'Wait...' : 'Book Slot & Pay'}
                        </button>
                    )}
                </PaymentGateway>
            )}
        </div>
    );
}

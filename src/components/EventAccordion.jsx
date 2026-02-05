'use client';
import { useState } from 'react';
import { ChevronDown, MapPin, Clock, MessageCircle, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function EventAccordion({ event, isOpen, onToggle, activeDay, onEventClick }) {
    // Determine status badge color
    const getStatusColor = () => {
        if (event.isSoldOut) return 'bg-red-500/20 text-red-500 border-red-500/30';
        return 'bg-green-500/20 text-green-400 border-green-500/30';
    };

    return (
        <div className="group mb-4">
            {/* Header / Trigger */}
            <button
                onClick={onToggle}
                className={`w-full text-left p-5 rounded-2xl flex items-center justify-between transition-all duration-300 border ${isOpen
                    ? 'bg-galaxy-purple/10 border-galaxy-purple/40 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
            >
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    {/* Icon Placeholder or Category Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${isOpen ? 'from-galaxy-purple to-pink-600 text-white' : 'from-gray-800 to-gray-900 text-gray-400'
                        } shadow-inner transition-colors duration-300`}>
                        <span className="font-bold text-lg">{event.name.charAt(0)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className={`text-lg md:text-xl font-bold truncate transition-colors ${isOpen ? 'text-white' : 'text-gray-200'}`}>
                                {event.name}
                            </h3>
                            {event.isSoldOut && (
                                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Sold Out
                                </span>
                            )}
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 truncate flex items-center gap-2">
                            <span className="uppercase tracking-wider font-semibold text-galaxy-accent">{event.type}</span>
                            <span>•</span>
                            <span>{event.price > 0 ? `₹${event.price}` : <span className="text-green-400 font-bold">Free</span>}</span>
                            {(() => {
                                const activeSlot = event.slots?.find(s => s.dayNumber === activeDay);
                                if (activeSlot) {
                                    const registered = activeSlot.registeredCount || 0;
                                    const capacity = activeSlot.maxCapacity || 0;
                                    const percentFilled = capacity > 0 ? (registered / capacity) * 100 : 0;
                                    const isAlmostFull = percentFilled >= 80;
                                    const isFull = registered >= capacity;

                                    return (
                                        <>
                                            <span>•</span>
                                            <span className={`font-semibold ${isFull ? 'text-red-400' : isAlmostFull ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {registered}/{capacity} seats
                                            </span>
                                        </>
                                    );
                                }
                                return null;
                            })()}
                        </p>
                    </div>
                </div>

                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-galaxy-purple' : 'text-gray-500'}`}>
                    <ChevronDown size={24} />
                </div>
            </button>

            {/* Expanded Content */}
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="p-6 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm relative">
                    {/* Decorative Line */}
                    <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-galaxy-purple to-transparent rounded-r-full opacity-50"></div>

                    <div className="pl-4 grid md:grid-cols-[2fr_1fr] gap-6">
                        <div className="space-y-4">


                            <div className="flex flex-wrap gap-4 mt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                    <Clock size={16} className="text-galaxy-purple" />
                                    <span>Time: {event.slots?.find(s => s.dayNumber === activeDay)?.startTime || 'TBD'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                    <MapPin size={16} className="text-galaxy-purple" />
                                    <span>Venue: {event.slots?.find(s => s.dayNumber === activeDay)?.venue || 'TBD'}</span>
                                </div>

                                {/* Seat Availability Progress Bar */}
                                {(() => {
                                    const activeSlot = event.slots?.find(s => s.dayNumber === activeDay);
                                    if (activeSlot) {
                                        const registered = activeSlot.registeredCount || 0;
                                        const capacity = activeSlot.maxCapacity || 0;
                                        const percentFilled = capacity > 0 ? (registered / capacity) * 100 : 0;
                                        const isAlmostFull = percentFilled >= 80;
                                        const isFull = registered >= capacity;

                                        return (
                                            <div className="flex items-center gap-2 text-sm bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                                <span className="text-gray-400 font-medium">Seats:</span>
                                                <div className="flex-1 bg-black/40 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' :
                                                                isAlmostFull ? 'bg-yellow-500' :
                                                                    'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(percentFilled, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`font-bold ${isFull ? 'text-red-400' :
                                                        isAlmostFull ? 'text-yellow-400' :
                                                            'text-green-400'
                                                    }`}>
                                                    {registered}/{capacity}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                            <button
                                onClick={onEventClick}
                                className="w-full bg-white text-black hover:bg-gray-100 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                            >
                                Reserve Seat <ExternalLink size={16} />
                            </button>

                            {event.whatsappLink && (
                                <a
                                    href={event.whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold py-3 px-4 rounded-xl border border-[#25D366]/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <MessageCircle size={18} /> Join WhatsApp Group
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

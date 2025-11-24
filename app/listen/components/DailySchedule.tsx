'use client';

import { format } from 'date-fns';
import { ScheduleSlot } from './types';
import { Clock, User } from 'lucide-react';

interface DailyScheduleProps {
    slots: ScheduleSlot[];
    isLoading: boolean;
    onShowClick: (showId: string) => void;
}

export default function DailySchedule({ slots, isLoading, onShowClick }: DailyScheduleProps) {
    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-500 animate-pulse">
                Loading schedule...
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                <p>No shows scheduled for this day.</p>
            </div>
        );
    }

    // Check if a show is currently live
    const now = new Date();

    return (
        <div className="pb-24 px-4 pt-4 space-y-3">
            {slots.map((slot) => {
                const startTime = new Date(slot.startTime);
                const endTime = new Date(slot.endTime);
                const isLive = now >= startTime && now < endTime;

                return (
                    <button
                        key={slot.id}
                        onClick={() => onShowClick(slot.show.id)}
                        className={`
              w-full text-left group relative overflow-hidden rounded-2xl transition-all duration-200
              ${isLive
                                ? 'bg-gray-800 ring-1 ring-red-500/50 shadow-lg shadow-red-900/10'
                                : 'bg-gray-900 hover:bg-gray-800'
                            }
            `}
                    >
                        <div className="flex p-4 gap-4">
                            {/* Thumbnail */}
                            <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-800">
                                {slot.show.image ? (
                                    <img
                                        src={slot.show.image}
                                        alt={slot.show.title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                                        <span className="text-2xl font-bold opacity-20">
                                            {slot.show.title.charAt(0)}
                                        </span>
                                    </div>
                                )}

                                {isLive && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold text-center py-0.5">
                                        ON AIR
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                        {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                    </span>
                                </div>

                                <h3 className={`font-bold text-lg truncate mb-1 ${isLive ? 'text-white' : 'text-gray-200'}`}>
                                    {slot.show.title}
                                </h3>

                                {slot.show.host && (
                                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                                        <User className="w-3 h-3" />
                                        <span className="truncate">{slot.show.host}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

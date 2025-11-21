"use client";

import { useState, useRef } from "react";
import { Calendar, Clock, Repeat, Radio } from "lucide-react";
import { format } from "date-fns";

interface ScheduleEventTooltipProps {
    event: {
        title: string;
        start: Date;
        end: Date;
        type: string;
        isRecurring: boolean;
    };
    children: React.ReactNode;
}

export function ScheduleEventTooltip({ event, children }: ScheduleEventTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Show immediately
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Hide immediately
        setIsVisible(false);
    };

    const duration = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));

    return (
        <div
            className="relative h-full w-full group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}

            {/* Tooltip */}
            {isVisible && (
                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-[10000] pointer-events-none">
                    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-3 min-w-[260px] max-w-[300px] whitespace-normal">
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2">
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800"></div>
                        </div>

                        {/* Header */}
                        <div className="flex items-start gap-2 mb-2 pb-2 border-b border-gray-700">
                            <Radio className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white text-sm leading-tight break-words">
                                    {event.title}
                                </h3>
                                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded mt-1 inline-block">
                                    {event.type}
                                </span>
                            </div>
                        </div>

                        {/* Time Info */}
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                    {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-300">
                                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span>{duration} minutes</span>
                            </div>

                            {event.isRecurring && (
                                <div className="flex items-center gap-2 text-yellow-400 mt-1">
                                    <Repeat className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>Recurring Weekly</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

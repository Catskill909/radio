'use client';

import { useEffect, useRef } from 'react';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface DayTabsProps {
    selectedDay: Date;
    onDayChange: (date: Date) => void;
    days: Date[];
}

export default function DayTabs({ selectedDay, onDayChange, days }: DayTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const today = new Date();

    // Check if today is in the visible week
    const isTodayVisible = days.some(day => isSameDay(day, today));

    // Scroll active tab into view
    useEffect(() => {
        if (scrollRef.current) {
            const activeTab = scrollRef.current.querySelector('[data-active="true"]');
            if (activeTab) {
                activeTab.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                });
            }
        }
    }, [selectedDay]);

    // Navigate to previous/next week
    const handlePreviousWeek = () => {
        if (days.length > 0) {
            onDayChange(subDays(days[0], 7));
        }
    };

    const handleNextWeek = () => {
        if (days.length > 0) {
            onDayChange(addDays(days[0], 7));
        }
    };

    // Jump back to today
    const handleBackToToday = () => {
        onDayChange(today);
    };

    return (
        // Mobile: top-[64px] to be below MobileHeader (pt-3 + content + pb-3 ≈ 64px)
        // Desktop: lg:top-[100px] to be below TopPlayerBar (lg: overrides mobile value)
        <div className="sticky top-[64px] lg:top-[100px] z-30 bg-black/95 backdrop-blur lg:border-b lg:border-gray-800">
            <div className="flex items-center justify-between gap-0 px-1 lg:justify-center lg:gap-2 lg:px-4">
                {/* Previous Week Button */}
                <button
                    onClick={handlePreviousWeek}
                    className="flex-shrink-0 p-1.5 lg:p-2 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors group cursor-pointer focus:outline-none"
                    aria-label="Previous week"
                >
                    <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400 group-hover:text-white transition-colors" strokeWidth={3} />
                </button>

                {/* Back to Today Button - Appears to the left of day tabs when today is not visible */}
                <div
                    className={`
                        transition-all duration-300 ease-in-out
                        ${isTodayVisible ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}
                    `}
                >
                    <button
                        onClick={handleBackToToday}
                        className={`
                            group flex flex-col items-center justify-center 
                            min-w-[38px] min-h-[40px] py-1 px-1.5 rounded-lg
                            lg:min-w-[60px] lg:h-[68px] lg:py-2 lg:px-3 lg:rounded-xl
                            bg-gradient-to-br from-gray-800/90 to-gray-900/90
                            border border-gray-700/50 lg:backdrop-blur-xl
                            hover:border-gray-600 hover:from-gray-700 hover:to-gray-800
                            transition-all duration-200 ease-out
                            hover:scale-105 active:scale-95 lg:shadow-lg lg:hover:shadow-xl
                            cursor-pointer
                            ${isTodayVisible ? 'invisible' : 'visible'}
                        `}
                        aria-label="Jump back to today"
                    >
                        <span className="text-[9px] lg:text-xs font-medium uppercase tracking-wide lg:tracking-wider text-gray-300 group-hover:text-white transition-colors">
                            TODAY
                        </span>
                        <span className="text-sm lg:text-lg font-bold text-white">
                            {format(today, 'd')}
                        </span>
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="flex flex-1 overflow-x-auto no-scrollbar py-2 lg:py-3 gap-0.5 lg:gap-2 snap-x justify-center"
                >
                    {days.map((date) => {
                        const isActive = isSameDay(date, selectedDay);
                        const isToday = isSameDay(date, today);

                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => onDayChange(date)}
                                data-active={isActive}
                                className={`
                    flex flex-col items-center justify-center 
                    min-w-[38px] min-h-[40px] py-1 px-1.5 rounded-lg
                    lg:min-w-[60px] lg:min-h-[48px] lg:py-2 lg:px-3 lg:rounded-xl
                    transition-all snap-center cursor-pointer
                    ${isActive
                                        ? 'bg-white text-black shadow-lg scale-105'
                                        : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105 active:scale-95 active:bg-gray-700'
                                    }
                  `}
                            >
                                <span className="text-[9px] lg:text-xs font-medium uppercase tracking-wide lg:tracking-wider">
                                    {isToday ? 'TODAY' : isActive ? format(date, 'MMM').toUpperCase() : format(date, 'EEE')}
                                </span>
                                <span className={`text-sm lg:text-lg font-bold ${isActive ? 'text-black' : 'text-white'}`}>
                                    {format(date, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Next Week Button */}
                <button
                    onClick={handleNextWeek}
                    className="flex-shrink-0 p-1.5 lg:p-2 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors group cursor-pointer focus:outline-none"
                    aria-label="Next week"
                >
                    <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400 group-hover:text-white transition-colors" strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}

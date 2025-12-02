'use client';

import { useEffect, useRef } from 'react';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayTabsProps {
    selectedDay: Date;
    onDayChange: (date: Date) => void;
    days: Date[];
}

export default function DayTabs({ selectedDay, onDayChange, days }: DayTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

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
        onDayChange(subDays(selectedDay, 7));
    };

    const handleNextWeek = () => {
        onDayChange(addDays(selectedDay, 7));
    };

    return (
        <div
            className="sticky top-[100px] z-30 bg-black/95 backdrop-blur border-b border-gray-800"
        >
            <div className="flex items-center justify-center gap-2 px-4">
                {/* Previous Week Button */}
                <button
                    onClick={handlePreviousWeek}
                    className="flex-shrink-0 p-2 hover:bg-gray-800 rounded-lg transition-colors group"
                    aria-label="Previous week"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" strokeWidth={3} />
                </button>

                {/* Day Tabs */}
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto no-scrollbar py-3 gap-2 snap-x"
                >
                    {days.map((date) => {
                        const isActive = isSameDay(date, selectedDay);
                        const isToday = isSameDay(date, new Date());

                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => onDayChange(date)}
                                data-active={isActive}
                                className={`
                    flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all snap-center
                    ${isActive
                                        ? 'bg-white text-black shadow-lg scale-105'
                                        : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                                    }
                  `}
                            >
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    {isToday ? 'TDY' : format(date, 'EEE')}
                                </span>
                                <span className={`text-lg font-bold ${isActive ? 'text-black' : 'text-white'}`}>
                                    {format(date, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Next Week Button */}
                <button
                    onClick={handleNextWeek}
                    className="flex-shrink-0 p-2 hover:bg-gray-800 rounded-lg transition-colors group"
                    aria-label="Next week"
                >
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}

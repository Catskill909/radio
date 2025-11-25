'use client';

import { useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';

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

    return (
        <div
            className="sticky top-[100px] z-30 bg-black/95 backdrop-blur border-b border-gray-800"
        >
            <div
                ref={scrollRef}
                className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-2 snap-x"
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
        </div>
    );
}

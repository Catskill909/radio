'use client';

import { format, addDays, startOfDay, isSameDay, setHours, setMinutes } from 'date-fns';
import { ScheduleSlot } from './types';

interface CalendarGridProps {
    slots: ScheduleSlot[];
    onShowClick: (showId: string) => void;
    weekStart: Date;
}

export default function CalendarGrid({ slots, onShowClick, weekStart }: CalendarGridProps) {
    // Generate 7 days starting from weekStart (or today)
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Time range: 6 AM to 10 PM (16 hours)
    const startHour = 6;
    const endHour = 22;
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    // Helper to position blocks
    const getBlockStyle = (slot: ScheduleSlot, dayDate: Date) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);

        // Calculate top offset (minutes from startHour)
        const startMinutes = (slotStart.getHours() - startHour) * 60 + slotStart.getMinutes();
        const durationMinutes = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60);

        // 60px height per hour
        const top = (startMinutes / 60) * 80;
        const height = (durationMinutes / 60) * 80;

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    return (
        <div className="w-full bg-gray-950 pt-[80px] min-h-screen overflow-x-auto">
            <div className="min-w-[1000px] p-8">
                {/* Header Row (Days) */}
                <div className="grid grid-cols-8 gap-4 mb-4 border-b border-gray-800 pb-2">
                    <div className="col-span-1 text-right pr-4 text-gray-500 text-sm font-medium pt-2">
                        Time
                    </div>
                    {days.map(day => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={day.toISOString()} className="col-span-1 text-center">
                                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-blue-400' : 'text-gray-500'}`}>
                                    {format(day, 'EEE')}
                                </p>
                                <p className={`text-2xl font-bold ${isToday ? 'text-white' : 'text-gray-400'}`}>
                                    {format(day, 'd')}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Grid Body */}
                <div className="relative grid grid-cols-8 gap-4">
                    {/* Time Labels Column */}
                    <div className="col-span-1 relative border-r border-gray-800/50">
                        {hours.map(hour => (
                            <div key={hour} className="h-[80px] text-right pr-4 text-xs text-gray-600 -mt-2">
                                {format(setHours(setMinutes(new Date(), 0), hour), 'h a')}
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {days.map(day => {
                        // Filter slots for this day
                        const daySlots = slots.filter(slot => isSameDay(new Date(slot.startTime), day));

                        return (
                            <div key={day.toISOString()} className="col-span-1 relative h-[1280px] bg-gray-900/20 rounded-lg border border-gray-800/30">
                                {/* Hour Lines */}
                                {hours.map(hour => (
                                    <div key={hour} className="absolute w-full border-t border-gray-800/30 h-[80px]" style={{ top: `${(hour - startHour) * 80}px` }} />
                                ))}

                                {/* Show Blocks */}
                                {daySlots.map(slot => (
                                    <button
                                        key={slot.id}
                                        onClick={() => onShowClick(slot.show.id)}
                                        className="absolute left-1 right-1 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 p-2 text-left transition-all hover:z-10 hover:shadow-xl group overflow-hidden"
                                        style={getBlockStyle(slot, day)}
                                    >
                                        <div className="h-full flex flex-col">
                                            <p className="text-xs font-bold text-white truncate group-hover:whitespace-normal">
                                                {slot.show.title}
                                            </p>
                                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                                {format(new Date(slot.startTime), 'h:mm')} - {format(new Date(slot.endTime), 'h:mm')}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

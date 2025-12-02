'use client';

import { parseISO, isPast } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import ScheduleCard from './ScheduleCard';
import { ScheduleSlot } from './types';

interface DailyScheduleProps {
    slots: ScheduleSlot[];
    isLoading: boolean;
    onShowClick: (showId: string) => void;
    stationTimezone: string;
}

export default function DailySchedule({ slots, isLoading, onShowClick, stationTimezone }: DailyScheduleProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                No shows scheduled for this day
            </div>
        );
    }

    // We use toZonedTime here, relying on the parent's re-render (every minute) to update this.
    const now = toZonedTime(new Date(), stationTimezone);

    return (
        <div className="px-4 pt-6 space-y-3 pb-[80vh]">
            {slots.map((slot) => {
                const startTime = new Date(slot.startTime);
                const endTime = new Date(slot.endTime);
                const isLive = now >= startTime && now < endTime;

                return (
                    <ScheduleCard
                        key={slot.id}
                        slot={slot}
                        isLive={isLive}
                        onShowClick={onShowClick}
                    />
                );
            })}
        </div>
    );
}

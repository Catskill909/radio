'use client';

import { ScheduleSlot } from './types';
import ScheduleCard from './ScheduleCard';

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
    // We use new Date() here, relying on the parent's re-render (every minute) to update this.
    const now = new Date();

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

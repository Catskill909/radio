import { getShows, getScheduleSlots, getStreams, getStationSettings } from "@/app/actions";
import Scheduler from "@/components/Scheduler";
import StationClock from "@/components/StationClock";
import "./calendar-custom.css";

// Force dynamic rendering to prevent caching issues with calendar navigation
export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
    const shows = await getShows();
    const slots = await getScheduleSlots();
    const streams = await getStreams();
    const settings = await getStationSettings();
    const timezone = settings.timezone || "UTC";

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>Schedule</h1>
                    <p className="text-gray-400 mt-2">Click any time slot to schedule a show</p>
                </div>
                <div className="flex-shrink-0">
                    <StationClock timezone={timezone} />
                </div>
            </div>
            <div className="flex-1">
                <Scheduler shows={shows} initialSlots={slots} streams={streams} stationTimezone={timezone} />
            </div>
        </div>
    );
}

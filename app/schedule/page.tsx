import { getScheduleSlots, getShows, getStreams, getStationSettings } from '@/app/actions';
import Scheduler from '@/components/Scheduler';
import HelpIcon from '@/components/HelpIcon';
import "./calendar-custom.css";

// Force dynamic rendering to prevent caching issues with calendar navigation
export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
    const slots = await getScheduleSlots();
    const shows = await getShows();
    const streams = await getStreams();
    const settings = await getStationSettings();
    const timezone = settings.timezone || "UTC";

    return (
        <div className="min-h-screen flex flex-col bg-gray-950">
            <div className="p-6 pb-0 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        Schedule
                        <HelpIcon articleId="scheduling-basics" tooltip="Learn about scheduling" />
                    </h1>
                    <p className="text-gray-400 mt-1">Manage your station's programming schedule</p>
                </div>
            </div>

            <div className="p-6 h-[calc(100vh-100px)]">
                <Scheduler
                    shows={shows}
                    initialSlots={slots}
                    streams={streams}
                    stationTimezone={timezone}
                />
            </div>
        </div>
    );
}

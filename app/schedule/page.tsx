import { getScheduleSlots, getShows, getStreams, getStationSettings } from '@/app/actions';
import Scheduler from '@/components/Scheduler';
import HelpIcon from '@/components/HelpIcon';
import StationClock from '@/components/StationClock';
import MiniPlayer from '@/components/MiniPlayer';
import "./calendar-custom.css";

// Force dynamic rendering to prevent caching issues with calendar navigation
export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Schedule',
};

export default async function SchedulePage() {
    const slots = await getScheduleSlots();
    const shows = await getShows();
    const streams = await getStreams();
    const settings = await getStationSettings();
    const timezone = settings.timezone || "UTC";
    const streamUrl = (settings as any).streamUrl || null;

    return (
        <div className="min-h-screen flex flex-col bg-gray-950">
            <div className="px-8 pt-8 pb-4 flex items-center shrink-0 gap-6">
                {/* Left - Page Title */}
                <div className="flex-shrink-0">
                    <h1 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        Schedule
                        <HelpIcon articleId="scheduling-basics" tooltip="Learn about scheduling" />
                    </h1>
                    <p className="text-gray-400 mt-1">Manage your station's programming schedule</p>
                </div>

                {/* Center - Mini Player */}
                <div className="flex-1 flex justify-center">
                    <MiniPlayer streamUrl={streamUrl} />
                </div>

                {/* Right - Clock */}
                <div className="flex-shrink-0">
                    <StationClock timezone={timezone} />
                </div>
            </div>

            <div className="px-8">
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

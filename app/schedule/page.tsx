import { getShows, getScheduleSlots } from "@/app/actions";
import Scheduler from "@/components/Scheduler";
import "./calendar-custom.css";

// Force dynamic rendering to prevent caching issues with calendar navigation
export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
    const shows = await getShows();
    const slots = await getScheduleSlots();

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-4xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>Schedule</h1>
                <p className="text-gray-400 mt-2">Click any time slot to schedule a show</p>
            </div>
            <div className="flex-1">
                <Scheduler shows={shows} initialSlots={slots} />
            </div>
        </div>
    );
}

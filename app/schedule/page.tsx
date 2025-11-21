import { getShows, getScheduleSlots } from "@/app/actions";
import Scheduler from "@/components/Scheduler";

export default async function SchedulePage() {
    const shows = await getShows();
    const slots = await getScheduleSlots();

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6">Schedule</h1>
            <Scheduler shows={shows} initialSlots={slots} />
        </div>
    );
}

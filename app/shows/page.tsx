import { getShows, getStreams, getStationSettings } from '@/app/actions';
import ShowsClient from '@/components/ShowsClient';

export const dynamic = 'force-dynamic';

export default async function ShowsPage() {
    const shows = await getShows();
    const streams = await getStreams();
    const stationSettings = await getStationSettings();

    return (
        <div className="p-6">
            <ShowsClient initialShows={shows} streams={streams} stationLogoUrl={stationSettings?.logoUrl || null} />
        </div>
    );
}

import { getShows, getStreams } from '@/app/actions';
import ShowsClient from '@/components/ShowsClient';

export default async function ShowsPage() {
    const shows = await getShows();
    const streams = await getStreams();

    return (
        <div className="p-6">
            <ShowsClient initialShows={shows} streams={streams} />
        </div>
    );
}

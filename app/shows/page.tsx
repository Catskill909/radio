import { getShows, getStreams } from "@/app/actions";
import ShowsClient from "@/components/ShowsClient";

export default async function ShowsPage() {
    const shows = await getShows();
    const streams = await getStreams();

    return <ShowsClient initialShows={shows} streams={streams} />;
}

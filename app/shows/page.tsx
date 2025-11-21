import { getShows } from "@/app/actions";
import ShowsClient from "@/components/ShowsClient";

export default async function ShowsPage() {
    const shows = await getShows();

    return <ShowsClient initialShows={shows} />;
}

import { getShowsWithEpisodes, getStationSettings } from "@/app/actions";
import EpisodesClient from "@/components/EpisodesClient";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Podcasts',
};

export default async function EpisodesPage() {
    const [shows, settings] = await Promise.all([
        getShowsWithEpisodes(),
        getStationSettings()
    ]);
    const timezone = settings.timezone || "UTC";

    return <EpisodesClient initialShows={shows} timezone={timezone} stationLogoUrl={settings?.logoUrl || null} />;
}

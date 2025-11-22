import { getShowsWithEpisodes, getStationSettings } from "@/app/actions";
import PodcastCard from "@/components/PodcastCard";
import { Rss } from "lucide-react";

export default async function EpisodesPage() {
    const [shows, settings] = await Promise.all([
        getShowsWithEpisodes(),
        getStationSettings()
    ]);
    const timezone = settings.timezone || "UTC";

    // Filter out shows that have no episodes if desired, or keep them to show empty state
    // For now, let's show all shows so users can see the RSS link even before publishing

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Podcast Dashboard</h1>
                    <p className="text-gray-400">Manage your podcast feeds and view latest episodes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {shows.map((show: any) => (
                    <PodcastCard key={show.id} show={show} timezone={timezone} />
                ))}

                {shows.length === 0 && (
                    <div className="text-center py-16 bg-gray-800 border border-gray-700 rounded-xl">
                        <Rss className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-semibold mb-2">No Shows Found</h3>
                        <p className="text-gray-400">Create a show to start generating a podcast feed.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

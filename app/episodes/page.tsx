import { getEpisodes } from "@/app/actions";
import Link from "next/link";
import { format } from "date-fns";
import { Edit } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";

export default async function EpisodesPage() {
    const episodes = await getEpisodes();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Episodes</h1>

            <div className="grid grid-cols-1 gap-4">
                {episodes.map((episode: any) => (
                    <div
                        key={episode.id}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors flex items-center justify-between"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-semibold">{episode.title}</h2>
                                <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                                    {episode.recording.scheduleSlot?.show.title || "Unknown Show"}
                                </span>
                            </div>
                            <p className="text-gray-400 mb-2">{episode.description}</p>
                            <div className="text-sm text-gray-500">
                                Recorded: {format(new Date(episode.createdAt), "PPP p")}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link
                                href={`/episodes/${episode.id}/edit`}
                                className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-300 hover:text-white"
                            >
                                <Edit className="w-5 h-5" />
                            </Link>
                            {/* Placeholder for audio player */}
                            {/* Audio Player */}
                            {episode.recording && (
                                <AudioPlayer
                                    src={`/api/audio/${episode.recording.filePath}`}
                                    title={episode.title}
                                />
                            )}
                        </div>
                    </div>
                ))}

                {episodes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No episodes recorded yet.
                    </div>
                )}
            </div>
        </div>
    );
}

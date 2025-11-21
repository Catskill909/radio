import { getEpisode, updateEpisode } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditEpisodePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const episode = await getEpisode(id);

    if (!episode) {
        notFound();
    }

    const updateEpisodeWithId = updateEpisode.bind(null, episode.id);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/episodes"
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold">Edit Episode</h1>
            </div>

            <form action={updateEpisodeWithId} className="space-y-6 bg-gray-800 p-8 rounded-xl border border-gray-700">
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                        Episode Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        defaultValue={episode.title}
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={episode.description || ""}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="seasonNumber" className="block text-sm font-medium text-gray-300">
                            Season Number
                        </label>
                        <input
                            type="number"
                            id="seasonNumber"
                            name="seasonNumber"
                            defaultValue={episode.seasonNumber || ""}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="episodeNumber" className="block text-sm font-medium text-gray-300">
                            Episode Number
                        </label>
                        <input
                            type="number"
                            id="episodeNumber"
                            name="episodeNumber"
                            defaultValue={episode.episodeNumber || ""}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

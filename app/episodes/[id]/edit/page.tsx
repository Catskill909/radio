import { getEpisode, updateEpisode } from "@/app/actions";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { FileAudio, Calendar, User, Clock } from "lucide-react";

export default async function EditEpisodePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const episode = await getEpisode(id);

    if (!episode) {
        redirect("/episodes");
    }

    async function handleUpdate(formData: FormData) {
        "use server";
        await updateEpisode(id, formData);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Edit Episode</h1>
                <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm font-medium border border-green-800">
                    Published
                </span>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-300">Episode Details</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                        <FileAudio className="w-4 h-4" />
                        <span>File: {episode.recording.filePath}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Published: {episode.publishedAt ? format(new Date(episode.publishedAt), "PPP") : 'Not published'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {episode.duration ? `${Math.floor(episode.duration / 60)}m ${episode.duration % 60}s` : 'Unknown'}</span>
                    </div>
                </div>
            </div>

            <form action={handleUpdate} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                        Episode Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        defaultValue={episode.title}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={episode.description || ""}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="seasonNumber" className="block text-sm font-medium text-gray-300 mb-2">
                            Season Number
                        </label>
                        <input
                            type="number"
                            id="seasonNumber"
                            name="seasonNumber"
                            min="1"
                            defaultValue={episode.seasonNumber || ""}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="episodeNumber" className="block text-sm font-medium text-gray-300 mb-2">
                            Episode Number
                        </label>
                        <input
                            type="number"
                            id="episodeNumber"
                            name="episodeNumber"
                            min="1"
                            defaultValue={episode.episodeNumber || ""}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-md font-semibold mb-4 text-gray-300">Metadata</h3>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="host" className="block text-sm font-medium text-gray-300 mb-2">
                                Host
                            </label>
                            <input
                                type="text"
                                id="host"
                                name="host"
                                defaultValue={episode.host || ""}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">
                                Episode Image URL
                            </label>
                            <input
                                type="url"
                                id="image"
                                name="image"
                                defaultValue={episode.imageUrl || ""}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                                Tags (comma separated)
                            </label>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                defaultValue={episode.tags || ""}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Save Changes
                    </button>
                    <a
                        href="/episodes"
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-center"
                    >
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    );
}

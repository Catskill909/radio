import { getRecording, publishRecording } from "@/app/actions";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { FileAudio, Calendar, User } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PublishRecordingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const recording = await getRecording(id);

    if (!recording) {
        redirect("/recordings");
    }

    if (recording.episode) {
        redirect("/recordings");
    }

    async function handlePublish(formData: FormData) {
        "use server";
        await publishRecording(id, formData);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Publish Recording as Episode</h1>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-300">Recording Details</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                        <FileAudio className="w-4 h-4" />
                        <span>File: {recording.filePath}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Recorded: {format(new Date(recording.startTime), "PPP 'at' p")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <FileAudio className="w-4 h-4" />
                        <span>Duration: {recording.duration ? `${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s` : 'Unknown'}</span>
                    </div>
                    {recording.scheduleSlot?.show && (
                        <>
                            <div className="flex items-center gap-2 text-gray-400">
                                <User className="w-4 h-4" />
                                <span>Show: {recording.scheduleSlot.show.title}</span>
                            </div>
                            {recording.scheduleSlot.show.host && (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <User className="w-4 h-4" />
                                    <span>Host: {recording.scheduleSlot.show.host}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <form action={handlePublish} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                        Episode Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        defaultValue={recording.scheduleSlot?.show?.title || ""}
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
                        defaultValue={recording.scheduleSlot?.show?.description || ""}
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
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-md font-semibold mb-4 text-gray-300">Metadata Overrides</h3>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="host" className="block text-sm font-medium text-gray-300 mb-2">
                                Host
                            </label>
                            <input
                                type="text"
                                id="host"
                                name="host"
                                defaultValue={recording.scheduleSlot?.show?.host || ""}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Leave empty to use show host"
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
                                defaultValue={recording.scheduleSlot?.show?.image || ""}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Leave empty to use show image"
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
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. music, interview, rock"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Publish Episode
                    </button>
                    <a
                        href="/recordings"
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-center"
                    >
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    );
}

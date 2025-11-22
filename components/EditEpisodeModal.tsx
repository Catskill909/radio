'use client'

import { useState, useTransition } from "react";
import { X, FileAudio, Loader } from "lucide-react";
import { updateEpisode } from "@/app/actions";
import ImageUpload from "./ImageUpload";

interface Episode {
    id: string;
    title: string;
    description: string | null;
    publishedAt: Date | null;
    duration: number | null;
    imageUrl: string | null;
    episodeNumber: number | null;
    seasonNumber: number | null;
    host: string | null;
    tags: string | null;
    explicit: boolean | null;
    recording: {
        filePath: string;
    };
}

interface EditEpisodeModalProps {
    episode: Episode;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function EditEpisodeModal({ episode, isOpen, onClose, onSave }: EditEpisodeModalProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState(episode.imageUrl || "");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);

        // Add the image URL to form data
        if (imageUrl) {
            formData.set("image", imageUrl);
        }

        startTransition(async () => {
            try {
                await updateEpisode(episode.id, formData);
                onSave();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to update episode");
            }
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 z-[60] transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <h2 className="text-2xl font-bold text-white">Edit Episode</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Media */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Episode Cover Art
                                        </label>
                                        <ImageUpload
                                            value={imageUrl}
                                            onChange={setImageUrl}
                                        />
                                        <p className="text-xs text-gray-400 mt-2">
                                            Square image, 1400x1400 to 3000x3000 pixels
                                        </p>
                                    </div>

                                    {/* Audio Info (Read-only) */}
                                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                            <FileAudio className="w-4 h-4" />
                                            Audio File
                                        </h3>
                                        <div className="space-y-2 text-sm text-gray-400">
                                            <div>
                                                <span className="text-gray-500">File:</span> {episode.recording.filePath}
                                            </div>
                                            {episode.duration && (
                                                <div>
                                                    <span className="text-gray-500">Duration:</span> {Math.floor(episode.duration / 60)}m {episode.duration % 60}s
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Metadata */}
                                <div className="space-y-4">
                                    {/* Title */}
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
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                                            Description / Show Notes
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={4}
                                            defaultValue={episode.description || ""}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    {/* Episode/Season Numbers */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="episodeNumber" className="block text-sm font-medium text-gray-300 mb-2">
                                                Episode #
                                            </label>
                                            <input
                                                type="number"
                                                id="episodeNumber"
                                                name="episodeNumber"
                                                min="1"
                                                defaultValue={episode.episodeNumber || ""}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="seasonNumber" className="block text-sm font-medium text-gray-300 mb-2">
                                                Season #
                                            </label>
                                            <input
                                                type="number"
                                                id="seasonNumber"
                                                name="seasonNumber"
                                                min="1"
                                                defaultValue={episode.seasonNumber || ""}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Host */}
                                    <div>
                                        <label htmlFor="host" className="block text-sm font-medium text-gray-300 mb-2">
                                            Host (Override)
                                        </label>
                                        <input
                                            type="text"
                                            id="host"
                                            name="host"
                                            defaultValue={episode.host || ""}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Leave empty to use show default
                                        </p>
                                    </div>

                                    {/* Explicit Rating */}
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="explicit"
                                                value="true"
                                                defaultChecked={episode.explicit || false}
                                                className="w-4 h-4 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-300">
                                                Explicit Content
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-400 mt-1 ml-6">
                                            Override show-level explicit rating
                                        </p>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                                            Tags
                                        </label>
                                        <input
                                            type="text"
                                            id="tags"
                                            name="tags"
                                            defaultValue={episode.tags || ""}
                                            placeholder="comedy, interview, technology"
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Comma-separated tags
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex gap-4">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                {isPending && <Loader className="w-5 h-5 animate-spin" />}
                                {isPending ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isPending}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

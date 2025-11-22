'use client'

import { useState, useEffect } from "react";
import { X, FileAudio, Calendar, Clock, Edit2, Play } from "lucide-react";
import { format } from "date-fns";
import { formatInTimezone } from "@/lib/client-date-utils";
import { getEpisodesForShow } from "@/app/actions";
import EditEpisodeModal from "./EditEpisodeModal";
import AudioPlayer from "./AudioPlayer";

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
        scheduleSlot: {
            show: {
                id: string;
                title: string;
                image: string | null;
            }
        } | null;
    };
}

interface EpisodeManagerDrawerProps {
    showId: string;
    showTitle: string;
    isOpen: boolean;
    onClose: () => void;
    timezone: string;
}

export default function EpisodeManagerDrawer({ showId, showTitle, isOpen, onClose, timezone }: EpisodeManagerDrawerProps) {
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
    const [playingEpisode, setPlayingEpisode] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadEpisodes();
        }
    }, [isOpen, showId]);

    const loadEpisodes = async () => {
        setLoading(true);
        try {
            const data = await getEpisodesForShow(showId);
            setEpisodes(data as any);
        } catch (error) {
            console.error("Failed to load episodes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEpisodeSaved = () => {
        setEditingEpisode(null);
        loadEpisodes(); // Refresh the list
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-900 border-l border-gray-700 z-50 shadow-2xl flex flex-col animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Manage Episodes</h2>
                        <p className="text-gray-400 text-sm mt-1">{showTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Episode List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-gray-400">Loading episodes...</div>
                        </div>
                    ) : episodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <FileAudio className="w-16 h-16 text-gray-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Episodes Yet</h3>
                            <p className="text-gray-400">Episodes will appear here once you publish recordings.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {episodes.map((episode) => (
                                <div
                                    key={episode.id}
                                    className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Thumbnail */}
                                        <div className="w-16 h-16 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {episode.imageUrl || episode.recording.scheduleSlot?.show.image ? (
                                                <img
                                                    src={episode.imageUrl || episode.recording.scheduleSlot?.show.image || ''}
                                                    alt={episode.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <FileAudio className="w-8 h-8 text-gray-500" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white truncate mb-1">
                                                {episode.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-2">
                                                {episode.publishedAt && (
                                                    <>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatInTimezone(new Date(episode.publishedAt), "PPP", timezone)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatInTimezone(new Date(episode.publishedAt), "p", timezone)}
                                                        </span>
                                                    </>
                                                )}
                                                {episode.duration && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.floor(episode.duration / 60)}m {episode.duration % 60}s
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded border border-green-800">
                                                    Published
                                                </span>
                                            </div>

                                            {/* Audio Player (expandable) */}
                                            {playingEpisode === episode.id && (
                                                <div className="mt-3">
                                                    <AudioPlayer
                                                        src={`/api/audio/${episode.recording.filePath}`}
                                                        title={episode.title}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPlayingEpisode(playingEpisode === episode.id ? null : episode.id)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                                title={playingEpisode === episode.id ? "Hide Player" : "Play"}
                                            >
                                                <Play className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setEditingEpisode(episode)}
                                                className="p-2 hover:bg-blue-900/50 text-blue-400 rounded-lg transition-colors"
                                                title="Edit Episode"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingEpisode && (
                <EditEpisodeModal
                    episode={editingEpisode}
                    isOpen={!!editingEpisode}
                    onClose={() => setEditingEpisode(null)}
                    onSave={handleEpisodeSaved}
                />
            )}
        </>
    );
}

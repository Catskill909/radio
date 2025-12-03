'use client'

import Link from "next/link";
import { format } from "date-fns";
import { FileAudio, Clock, Check, XCircle, Loader, Trash2, Search, X, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { deleteRecording } from "@/app/actions";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AudioPlayer from "./AudioPlayer";

interface RecordingsListProps {
    recordings: any[];
}

export default function RecordingsList({ recordings }: RecordingsListProps) {
    const [recordingToDelete, setRecordingToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter recordings based on search query
    const filteredRecordings = useMemo(() => {
        if (!searchQuery.trim()) return recordings

        const query = searchQuery.toLowerCase()
        return recordings.filter((recording: any) =>
            recording.scheduleSlot?.show?.title?.toLowerCase().includes(query) ||
            recording.scheduleSlot?.show?.host?.toLowerCase().includes(query) ||
            recording.episode?.title?.toLowerCase().includes(query) ||
            recording.status.toLowerCase().includes(query)
        )
    }, [recordings, searchQuery]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "RECORDING":
                return (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-700">
                        <Loader className="w-3 h-3 animate-spin" />
                        Recording
                    </span>
                );
            case "COMPLETED":
                return (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-700">
                        <Check className="w-3 h-3" />
                        Completed
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-900/50 text-gray-400 px-2 py-1 rounded border border-gray-700">
                        <XCircle className="w-3 h-3" />
                        Failed
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded border border-yellow-700">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                );
            default:
                return null;
        }
    };

    const handleDelete = async () => {
        if (recordingToDelete) {
            await deleteRecording(recordingToDelete);
            setRecordingToDelete(null);
        }
    };

    return (
        <>
            {/* Search Box */}
            <div className="relative max-w-2xl mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-500" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recordings by show, host, or status..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-11 pr-11 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Results count when searching */}
            {searchQuery && (
                <p className="text-sm text-gray-400 mb-4">
                    Found {filteredRecordings.length} {filteredRecordings.length === 1 ? 'recording' : 'recordings'}
                </p>
            )}

            <div className="grid grid-cols-1 gap-4">
                {filteredRecordings.map((recording: any) => (
                    <div
                        key={recording.id}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            {/* Left: Metadata */}
                            <div className="w-1/3 min-w-[300px] flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <FileAudio className="w-4 h-4 text-blue-400 shrink-0" />
                                    <h2 className="text-base font-semibold truncate" title={recording.scheduleSlot?.show?.title}>
                                        {recording.scheduleSlot?.show?.title || "Unknown Show"}
                                    </h2>
                                    {getStatusBadge(recording.status)}
                                </div>

                                <div className="flex flex-col text-xs text-gray-400 gap-0.5 pl-6">
                                    {recording.scheduleSlot?.show?.host && (
                                        <span className="truncate">Host: {recording.scheduleSlot.show.host}</span>
                                    )}
                                    <div className="flex gap-2">
                                        <span>{format(new Date(recording.startTime), "PPP")}</span>
                                        <span>
                                            {format(new Date(recording.startTime), "p")} - {recording.endTime ? format(new Date(recording.endTime), "p") : '...'}
                                        </span>
                                    </div>

                                    {/* Quality Badge */}
                                    {recording.audioCodec && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                            <span className="bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-600">
                                                {recording.audioCodec === 'libmp3lame' ? 'MP3' :
                                                    recording.audioCodec === 'aac' ? 'AAC' :
                                                        recording.audioCodec === 'libopus' ? 'Opus' :
                                                            recording.audioCodec === 'flac' ? 'FLAC' : recording.audioCodec}
                                            </span>
                                            {recording.audioBitrate && (
                                                <span className="bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-600">
                                                    {recording.audioBitrate} kbps
                                                </span>
                                            )}
                                            {recording.audioSampleRate && (
                                                <span className="bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-600">
                                                    {(recording.audioSampleRate / 1000).toFixed(1)} kHz
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Published Badge */}
                                {recording.episode && (
                                    <div className="ml-6 mt-1 inline-flex items-center gap-1.5 text-green-400 text-xs bg-green-900/20 px-2 py-0.5 rounded-full border border-green-900/50 w-fit">
                                        <Check className="w-3 h-3" />
                                        <span>Published: {recording.episode.title}</span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Audio Player & Actions */}
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                                {recording.status === "COMPLETED" && (
                                    <div className="flex-1 flex flex-col gap-2 items-center min-w-0">
                                        <AudioPlayer
                                            src={`/api/audio/${recording.filePath}`}
                                            title={recording.scheduleSlot?.show?.title}
                                        />
                                        <a
                                            href={`/api/audio/${recording.filePath}`}
                                            download={`${recording.scheduleSlot?.show?.title || 'recording'} - ${format(new Date(recording.startTime), 'yyyy-MM-dd')}.${recording.filePath.split('.').pop()}`}
                                            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 text-xs font-medium text-gray-300 hover:text-gray-100 transition-all"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Download
                                        </a>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {recording.status === "COMPLETED" && !recording.episode && (
                                        <Link
                                            href={`/recordings/${recording.id}/publish`}
                                            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-xs font-medium text-white transition-all whitespace-nowrap"
                                        >
                                            Publish
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => setRecordingToDelete(recording.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                                        title="Delete Recording"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredRecordings.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-800 border border-gray-700 rounded-xl">
                        <FileAudio className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        {searchQuery ? (
                            <>
                                <p className="text-lg">No Recordings Found</p>
                                <p className="text-sm mt-1">No recordings match "{searchQuery}"</p>
                            </>
                        ) : (
                            <>
                                <p className="text-lg">No recordings yet</p>
                                <p className="text-sm mt-1">Recordings will appear here when shows are recorded</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <DeleteConfirmModal
                isOpen={!!recordingToDelete}
                onClose={() => setRecordingToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Recording"
                message="Are you sure you want to delete this recording? This action cannot be undone and will remove the audio file permanently."
                confirmText="Delete Recording"
            />
        </>
    );
}

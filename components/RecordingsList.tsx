'use client'

import Link from "next/link";
import { format } from "date-fns";
import { FileAudio, Clock, Check, XCircle, Loader, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteRecording } from "@/app/actions";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AudioPlayer from "./AudioPlayer";

interface RecordingsListProps {
    recordings: any[];
}

export default function RecordingsList({ recordings }: RecordingsListProps) {
    const [recordingToDelete, setRecordingToDelete] = useState<string | null>(null);

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
            <div className="grid grid-cols-1 gap-4">
                {recordings.map((recording: any) => (
                    <div
                        key={recording.id}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
                    >
                        <div className="flex flex-col gap-4">
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <FileAudio className="w-4 h-4 text-blue-400" />
                                        <h2 className="text-lg font-semibold">
                                            {recording.scheduleSlot?.show?.title || "Unknown Show"}
                                        </h2>
                                        {getStatusBadge(recording.status)}
                                    </div>

                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
                                        {recording.scheduleSlot?.show?.host && (
                                            <span>Host: {recording.scheduleSlot.show.host}</span>
                                        )}
                                        <span>
                                            {format(new Date(recording.startTime), "PPP")}
                                        </span>
                                        <span>
                                            {format(new Date(recording.startTime), "p")} - {recording.endTime ? format(new Date(recording.endTime), "p") : '...'}
                                        </span>
                                    </div>

                                    {/* Compact Published Badge */}
                                    {recording.episode && (
                                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-green-400 text-xs bg-green-900/20 px-2.5 py-0.5 rounded-full border border-green-900/50">
                                            <Check className="w-3 h-3" />
                                            <span>Published: {recording.episode.title}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-2">
                                    {recording.status === "COMPLETED" && !recording.episode && (
                                        <Link
                                            href={`/recordings/${recording.id}/publish`}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-sm font-medium text-white transition-all"
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

                            {/* Audio Player Row */}
                            {recording.status === "COMPLETED" && (
                                <div className="w-full">
                                    <AudioPlayer
                                        src={`/api/audio/${recording.filePath}`}
                                        title={recording.scheduleSlot?.show?.title}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {recordings.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-800 border border-gray-700 rounded-xl">
                        <FileAudio className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-lg">No recordings yet</p>
                        <p className="text-sm mt-1">Recordings will appear here when shows are recorded</p>
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

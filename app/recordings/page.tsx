import { getRecordings } from "@/app/actions";
import Link from "next/link";
import { format } from "date-fns";
import { FileAudio, Clock, Check, XCircle, Loader } from "lucide-react";

export default async function RecordingsPage() {
    const recordings = await getRecordings();

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Recordings</h1>
                <Link
                    href="/episodes"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    View Published Episodes
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {recordings.map((recording: any) => (
                    <div
                        key={recording.id}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileAudio className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-xl font-semibold">
                                        {recording.scheduleSlot?.show?.title || "Unknown Show"}
                                    </h2>
                                    {getStatusBadge(recording.status)}
                                </div>

                                <div className="space-y-1 text-sm text-gray-400">
                                    {recording.scheduleSlot?.show?.host && (
                                        <div>Host: {recording.scheduleSlot.show.host}</div>
                                    )}
                                    <div>
                                        Started: {format(new Date(recording.startTime), "PPP 'at' p")}
                                    </div>
                                    {recording.endTime && (
                                        <div>
                                            Ended: {format(new Date(recording.endTime), "PPP 'at' p")}
                                        </div>
                                    )}
                                    <div className="font-mono text-xs text-gray-500 mt-2">
                                        File: {recording.filePath}
                                    </div>
                                </div>

                                {recording.episode && (
                                    <div className="mt-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                                        <div className="flex items-center gap-2 text-green-300 text-sm">
                                            <Check className="w-4 h-4" />
                                            Published as Episode: {recording.episode.title}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {recording.status === "COMPLETED" && !recording.episode && (
                                    <Link
                                        href={`/recordings/${recording.id}/publish`}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm text-center"
                                    >
                                        Publish as Episode
                                    </Link>
                                )}
                                {recording.status === "COMPLETED" && (
                                    <div className="mt-2">
                                        <audio
                                            controls
                                            className="w-64 h-10"
                                            preload="none"
                                        >
                                            <source src={`/recordings/${recording.filePath}`} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                )}
                            </div>
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
        </div>
    );
}

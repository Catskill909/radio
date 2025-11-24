import { getRecordings } from "@/app/actions";
import Link from "next/link";
import RecordingsList from "@/components/RecordingsList";

export default async function RecordingsPage() {
    const recordings = await getRecordings();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Recordings</h1>
                <Link
                    href="/episodes"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-sm font-medium text-white transition-all"
                >
                    View Published Episodes
                </Link>
            </div>

            <RecordingsList recordings={recordings} />
        </div>
    );
}

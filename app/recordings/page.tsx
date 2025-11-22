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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    View Published Episodes
                </Link>
            </div>

            <RecordingsList recordings={recordings} />
        </div>
    );
}

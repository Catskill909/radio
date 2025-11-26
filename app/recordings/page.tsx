import { getRecordings } from '@/app/actions';
import RecordingsList from '@/components/RecordingsList';
import HelpIcon from '@/components/HelpIcon';

export default async function RecordingsPage() {
    const recordings = await getRecordings();

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    Recordings
                    <HelpIcon articleId="recording-configuration" tooltip="Learn about recordings" />
                </h1>
                <p className="text-gray-400 mt-1">Manage your station's automated recordings</p>
            </div>

            <RecordingsList recordings={recordings} />
        </div>
    );
}

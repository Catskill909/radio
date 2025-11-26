import { getStreams } from '@/app/actions';
import StreamsClient from '@/components/StreamsClient';
import HelpIcon from '@/components/HelpIcon';

export default async function StreamsPage() {
    const streams = await getStreams();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        Icecast Streams
                        <HelpIcon articleId="adding-icecast-streams" tooltip="Learn about adding streams" />
                    </h1>
                    <p className="text-gray-400 mt-1">Manage your station's audio sources</p>
                </div>
                {/* Create button is inside StreamsClient */}
            </div>

            <StreamsClient initialStreams={streams} />
        </div>
    );
}

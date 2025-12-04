import { getStreams } from '@/app/actions';
import StreamsClient from '@/components/StreamsClient';
import HelpIcon from '@/components/HelpIcon';

export const dynamic = 'force-dynamic';

export default async function StreamsPage() {
    const streams = await getStreams();

    return (
        <div className="p-6">
            <StreamsClient initialStreams={streams} />
        </div>
    );
}

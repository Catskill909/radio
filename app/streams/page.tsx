import { getStreams } from "@/app/actions";
import StreamsClient from "@/components/StreamsClient";

export default async function StreamsPage() {
    const streams = await getStreams();

    return <StreamsClient initialStreams={streams} />;
}

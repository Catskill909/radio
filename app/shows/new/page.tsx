import { getStreams } from "@/app/actions";
import NewShowForm from "@/components/NewShowForm";

export default async function NewShowPage() {
    const streams = await getStreams();

    return <NewShowForm streams={streams} />;
}

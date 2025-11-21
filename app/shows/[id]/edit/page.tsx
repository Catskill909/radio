import { getShow, updateShow } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { redirect } from "next/navigation";
import EditShowForm from "@/components/EditShowForm";

export default async function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const show = await getShow(id);

    if (!show) {
        redirect("/shows");
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-4 flex-shrink-0">
                <Link
                    href="/shows"
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold">Edit Show</h1>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
                <EditShowForm show={show} />
            </div>
        </div>
    );
}

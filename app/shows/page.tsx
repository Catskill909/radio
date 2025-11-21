import { getShows } from "@/app/actions";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Show } from "@prisma/client";

export default async function ShowsPage() {
    const shows = await getShows();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Shows</h1>
                <Link
                    href="/shows/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Show
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shows.map((show: Show) => (
                    <div
                        key={show.id}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">{show.title}</h2>
                                <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                                    {show.type}
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-400 line-clamp-3">{show.description}</p>
                    </div>
                ))}

                {shows.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No shows created yet. Click "Create Show" to get started.
                    </div>
                )}
            </div>
        </div>
    );
}

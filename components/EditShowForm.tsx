'use client'

import { updateShow, deleteShow, getScheduleSlots } from "@/app/actions";
import ImageUpload from "@/components/ImageUpload";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import RecordingControls from "@/components/RecordingControls";
import { useState, useEffect } from "react";
import { Show } from "@prisma/client";
import { useRouter } from "next/navigation";

export default function EditShowForm({ show, streams }: { show: Show; streams: { id: string; name: string; url: string }[] }) {
    const [imageUrl, setImageUrl] = useState(show.image || "");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordingEnabled, setRecordingEnabled] = useState(show.recordingEnabled || false);
    const [recordingSource, setRecordingSource] = useState(show.recordingSource || "");
    const router = useRouter();

    // Wrap the server action to pass the ID
    const handleSubmit = async (formData: FormData) => {
        await updateShow(show.id, formData);
    };

    const handleDelete = async () => {
        await deleteShow(show.id);
        // Router will redirect via the server action
    };

    return (
        <>
            <form action={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                        Show Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        defaultValue={show.title}
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="host" className="block text-sm font-medium text-gray-300">
                        Host
                    </label>
                    <input
                        type="text"
                        id="host"
                        name="host"
                        defaultValue={show.host || ""}
                        placeholder="e.g. John Smith"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        defaultValue={show.description || ""}
                        rows={4}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                        Show Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        {["Local Podcast", "Syndicated Podcast", "Local Music", "Syndicated Music"].map((type) => (
                            <label
                                key={type}
                                className={`flex items-center gap-3 p-4 bg-gray-900 border rounded-lg cursor-pointer transition-colors ${show.type === type ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value={type}
                                    defaultChecked={show.type === type}
                                    required
                                    className="text-blue-600 focus:ring-blue-500 bg-gray-800 border-gray-600 w-4 h-4"
                                />
                                <span>{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <RecordingControls
                    recordingEnabled={recordingEnabled}
                    onRecordingEnabledChange={setRecordingEnabled}
                    recordingSource={recordingSource}
                    onRecordingSourceChange={setRecordingSource}
                    streams={streams}
                />

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                        Cover Image
                    </label>
                    <input type="hidden" name="image" value={imageUrl} />
                    <ImageUpload value={imageUrl} onChange={setImageUrl} />
                </div>

                <div className="pt-4 flex gap-4">
                    <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg hover:shadow-blue-500/20"
                    >
                        Update Show
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 rounded-lg transition-colors shadow-lg hover:shadow-red-500/20"
                    >
                        Delete
                    </button>
                </div>
            </form>

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Show?"
                message="This will permanently delete this show and all its scheduled slots. This action cannot be undone."
            />
        </>
    );
}

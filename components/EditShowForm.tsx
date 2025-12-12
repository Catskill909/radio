'use client'

import { updateShow, deleteShow, getScheduleSlots } from "@/app/actions";
import ImageUpload from "@/components/ImageUpload";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import RecordingControls from "@/components/RecordingControls";
import { useState, useEffect } from "react";
import { Show } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Tooltip } from "./Tooltip";
import ItunesCategorySelect from "@/components/iTunesCategorySelect";
import Switch from "@/components/Switch";

interface EditShowFormProps {
    show: Show;
    streams: { id: string; name: string; url: string }[];
    hideRecordingControls?: boolean;  // Hide when used in slot context (slot has its own controls)
    hideActionButtons?: boolean;  // Hide Update/Delete buttons when used in scheduling context
    formId?: string;  // Optional form ID for external button submission
    onAfterSubmit?: () => void;  // Callback after successful form submission
}

export default function EditShowForm({ show, streams, hideRecordingControls = false, hideActionButtons = false, formId, onAfterSubmit }: EditShowFormProps) {
    const [imageUrl, setImageUrl] = useState(show.image || "");
    const [categoryValue, setCategoryValue] = useState(show.category || "");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordingEnabled, setRecordingEnabled] = useState(show.recordingEnabled || false);
    const [recordingSource, setRecordingSource] = useState(show.recordingSource || "");
    const [feedEpisodeLimit, setFeedEpisodeLimit] = useState<number | null>(show.feedEpisodeLimit ?? null);
    const [archivingEnabled, setArchivingEnabled] = useState(show.archivingEnabled ?? true);
    const [showCustomLimit, setShowCustomLimit] = useState(false);
    const router = useRouter();

    // Wrap the server action to pass the ID
    const handleSubmit = async (formData: FormData) => {
        await updateShow(show.id, formData);
        // Call onAfterSubmit callback if provided (e.g., to schedule the show after updating)
        if (onAfterSubmit) {
            onAfterSubmit();
        }
    };

    const handleDelete = async () => {
        await deleteShow(show.id);
        router.push("/shows");
        router.refresh();
    };

    return (
        <>
            <form id={formId} action={handleSubmit} className="grid grid-cols-12 gap-4">
                {/* Title - Span 12 */}
                <div className="col-span-12 space-y-1.5">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                        Show Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        defaultValue={show.title}
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                </div>

                {/* Host - Span 4 */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                    <label htmlFor="host" className="block text-sm font-medium text-gray-300">
                        Host
                    </label>
                    <input
                        type="text"
                        id="host"
                        name="host"
                        defaultValue={show.host || ""}
                        placeholder="e.g. John Smith"
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                </div>

                {/* Email - Span 4 */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Contact Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={show.email || ""}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="podcasts@example.com"
                    />
                </div>

                {/* Author - Span 4 */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                    <label htmlFor="author" className="block text-sm font-medium text-gray-300">
                        iTunes Author
                    </label>
                    <input
                        type="text"
                        id="author"
                        name="author"
                        defaultValue={show.author || ""}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="e.g. Radio Station Name"
                    />
                </div>







                {/* Language - Span 4 */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                    <label htmlFor="language" className="block text-sm font-medium text-gray-300">
                        Language
                    </label>
                    <input
                        type="text"
                        id="language"
                        name="language"
                        defaultValue={show.language || "en-us"}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="e.g. en-us"
                    />
                </div>

                {/* Copyright - Span 4 */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                    <label htmlFor="copyright" className="block text-sm font-medium text-gray-300">
                        Copyright
                    </label>
                    <input
                        type="text"
                        id="copyright"
                        name="copyright"
                        defaultValue={show.copyright || ""}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="e.g. © 2025 Station Name"
                    />
                </div>

                {/* Website Link - Span 4 */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                    <label htmlFor="link" className="block text-sm font-medium text-gray-300">
                        Website URL
                    </label>
                    <input
                        type="url"
                        id="link"
                        name="link"
                        defaultValue={show.link || ""}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="https://example.com"
                    />
                </div>



                {/* Category - Span 4 */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                    <ItunesCategorySelect
                        value={categoryValue}
                        onChange={setCategoryValue}
                    />
                    <input type="hidden" name="category" value={categoryValue} />
                </div>

                {/* Tags - Span 8 */}
                <div className="col-span-12 md:col-span-8 space-y-1.5">
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-300">
                        Tags (comma separated)
                    </label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        defaultValue={show.tags || ""}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="jazz, local, morning show"
                    />
                </div>

                {/* Explicit - Span 12 */}
                <div className="col-span-12">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="explicit"
                            value="true"
                            defaultChecked={show.explicit}
                            className="w-4 h-4 text-blue-600 rounded border-gray-700 bg-gray-900 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">Explicit Content?</span>
                    </label>
                </div>

                {/* Description - Full Width */}
                <div className="col-span-12 space-y-1.5">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        defaultValue={show.description || ""}
                        rows={3}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                </div>

                {/* iTunes Type - Span 12 */}
                <div className="col-span-12 space-y-1.5">
                    <label htmlFor="itunesType" className="block text-sm font-medium text-gray-300">
                        iTunes Type
                    </label>
                    <select
                        id="itunesType"
                        name="itunesType"
                        defaultValue={show.itunesType || "episodic"}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    >
                        <option value="episodic">Episodic (Default)</option>
                        <option value="serial">Serial</option>
                    </select>
                    <p className="text-xs text-gray-500">
                        Episodic: Newest episodes first. Serial: Oldest episodes first (good for storytelling).
                    </p>
                </div>

                {/* Show Type - Full Width */}
                <div className="col-span-12 space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">
                        Show Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {["Local Podcast", "Syndicated Podcast", "Local Music", "Syndicated Music"].map((type) => (
                            <label
                                key={type}
                                className={`flex items-center gap-2 p-2.5 bg-gray-900 border rounded-md cursor-pointer transition-colors ${show.type === type ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value={type}
                                    defaultChecked={show.type === type}
                                    required
                                    className="text-blue-600 focus:ring-blue-500 bg-gray-800 border-gray-600 w-3.5 h-3.5"
                                />
                                <span className="text-xs font-medium">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* RSS Feed Settings */}
                <div className="col-span-12 pt-4 border-t border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">RSS Feed Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Episode Limit */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Episodes in Feed
                            </label>
                            <input type="hidden" name="feedEpisodeLimit" value={feedEpisodeLimit ?? ""} />
                            <div className="flex flex-wrap gap-1.5">
                                {[2, 5, 10, 20, 30, 50, 100].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => { setFeedEpisodeLimit(num); setShowCustomLimit(false); }}
                                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all ${feedEpisodeLimit === num && !showCustomLimit
                                            ? 'bg-blue-600 border-blue-500 text-white'
                                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                            }`}
                                    >
                                        {num}{num === 2 && <span className="text-[10px] ml-1 text-blue-300">♪</span>}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => { setFeedEpisodeLimit(null); setShowCustomLimit(false); }}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all ${feedEpisodeLimit === null && !showCustomLimit
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                        }`}
                                >
                                    ∞
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomLimit(true)}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all ${showCustomLimit
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                        }`}
                                >
                                    Custom
                                </button>
                            </div>
                            {showCustomLimit && (
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Enter number..."
                                    value={feedEpisodeLimit ?? ""}
                                    onChange={(e) => setFeedEpisodeLimit(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-24 bg-gray-900 border border-gray-700 rounded-md px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                    autoFocus
                                />
                            )}
                            <p className="text-xs text-gray-500">
                                {feedEpisodeLimit === 2 ? "Recommended for music shows (licensing compliance)." :
                                    feedEpisodeLimit === null ? "All episodes will appear in RSS feed." :
                                        `Latest ${feedEpisodeLimit} episodes will appear in RSS feed.`}
                            </p>
                        </div>

                        {/* Archiving Toggle */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300">
                                Archiving
                            </label>
                            <div className="flex items-center gap-3 mt-2">
                                <input type="hidden" name="archivingEnabled" value={archivingEnabled ? "true" : "false"} />
                                <Switch
                                    checked={archivingEnabled}
                                    onChange={setArchivingEnabled}
                                />
                                <span className="text-sm text-gray-400">
                                    {archivingEnabled ? "Keep old episodes" : "Delete old episodes"}
                                </span>
                            </div>
                            {archivingEnabled ? (
                                <p className="text-xs text-gray-500">
                                    Episodes beyond the feed limit are kept on disk.
                                </p>
                            ) : (
                                <div className="p-2 bg-red-900/30 border border-red-700/50 rounded-md mt-2">
                                    <p className="text-xs text-red-300 font-medium">
                                        ⚠️ Audio files will be permanently deleted
                                    </p>
                                    <p className="text-xs text-red-400/80 mt-0.5">
                                        Oldest recordings beyond the feed limit are automatically removed. Download files from Settings → Audio if you need to keep them.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recording Settings & Cover Image Row */}
                <div className="col-span-12 grid grid-cols-12 gap-4 pt-2 border-t border-gray-800">
                    {/* Recording Controls - Span 8 (hidden when in slot context) */}
                    {!hideRecordingControls && (
                        <div className="col-span-12 md:col-span-8">
                            <RecordingControls
                                recordingEnabled={recordingEnabled}
                                onRecordingEnabledChange={setRecordingEnabled}
                                recordingSource={recordingSource}
                                onRecordingSourceChange={setRecordingSource}
                                streams={streams}
                            />
                        </div>
                    )}

                    {/* Cover Image - Span 4 */}
                    <div className="col-span-12 md:col-span-4 space-y-1.5">
                        <label className="block text-sm font-medium text-gray-300">
                            Cover Image
                        </label>
                        <input type="hidden" name="image" value={imageUrl} />
                        <div className="w-full max-w-xs">
                            <ImageUpload value={imageUrl} onChange={setImageUrl} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            If no image is uploaded, the Station Identity image will be used.
                        </p>
                    </div>
                </div>

                {/* Buttons - Span 12 (but restricted width) - hidden in scheduling context */}
                {!hideActionButtons && (
                    <div className="col-span-12 pt-4 flex gap-3">
                        <button
                            type="submit"
                            className="w-full md:w-auto px-8 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-white font-bold py-3 transition-all shadow-lg text-sm"
                        >
                            Update Show
                        </button>
                        <Tooltip content="Delete Show">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full md:w-auto px-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition-colors shadow-lg hover:shadow-red-500/20 text-sm"
                            >
                                Delete
                            </button>
                        </Tooltip>
                    </div>
                )}
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

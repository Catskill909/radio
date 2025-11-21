'use client'

import { createShow } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import DateTimePicker from "@/components/DateTimePicker";
import RecordingControls from "@/components/RecordingControls";
import { useState } from "react";
import "@/app/shows/datepicker-dark.css";

interface NewShowFormProps {
    streams: { id: string; name: string; url: string }[];
}

export default function NewShowForm({ streams }: NewShowFormProps) {
    const [imageUrl, setImageUrl] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [recordingEnabled, setRecordingEnabled] = useState(false);
    const [recordingSource, setRecordingSource] = useState("");

    const handleSubmit = async (formData: FormData) => {
        // Convert date/time to the format expected by server action
        if (startDate && startTime) {
            const dateStr = startDate.toISOString().split('T')[0];
            const timeStr = startTime.toTimeString().split(' ')[0].substring(0, 5);

            formData.set('startDate', dateStr);
            formData.set('startTime', timeStr);
        }

        await createShow(formData);
    };

    return (
        <div className="h-full flex flex-col bg-gray-900">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-800 flex-shrink-0">
                <Link
                    href="/shows"
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Create New Show</h1>
            </div>

            {/* Form - Grid Layout */}
            <div className="flex-1 overflow-y-auto p-6">
                <form action={handleSubmit} className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-12 gap-4">
                        {/* Title - Span 8 */}
                        <div className="col-span-12 md:col-span-8 space-y-1.5">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                                Show Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="e.g. Morning Jazz"
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
                                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="e.g. John Smith"
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
                                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="e.g. Radio Station Name"
                            />
                        </div>

                        {/* Category - Span 4 */}
                        <div className="col-span-12 md:col-span-4 space-y-1.5">
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300">
                                iTunes Category
                            </label>
                            <input
                                type="text"
                                id="category"
                                name="category"
                                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="e.g. Music"
                            />
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
                                rows={2}
                                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="Describe the show..."
                            />
                        </div>

                        {/* Show Type - Span 12 but compact grid inside */}
                        <div className="col-span-12 space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300">
                                Show Type
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {["Local Podcast", "Syndicated Podcast", "Local Music", "Syndicated Music"].map((type) => (
                                    <label
                                        key={type}
                                        className="flex items-center gap-2 p-2.5 bg-gray-900 border border-gray-700 rounded-md cursor-pointer hover:border-gray-500 transition-colors"
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type}
                                            required
                                            className="text-blue-600 focus:ring-blue-500 bg-gray-800 border-gray-600 w-3.5 h-3.5"
                                        />
                                        <span className="text-xs font-medium">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Start Date - Span 4 */}
                        <div className="col-span-12 md:col-span-4 space-y-1.5">
                            <DateTimePicker
                                selected={startDate}
                                onChange={setStartDate}
                                label="Start Date"
                                required
                                minDate={new Date()}
                            />
                        </div>

                        {/* Start Time - Span 4 */}
                        <div className="col-span-12 md:col-span-4 space-y-1.5">
                            <DateTimePicker
                                selected={startTime}
                                onChange={setStartTime}
                                label="Start Time"
                                required
                                timeOnly
                                showTimeSelect
                            />
                        </div>

                        {/* Duration - Span 4 */}
                        <div className="col-span-12 md:col-span-4 space-y-1.5">
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-300">
                                Duration (min)
                            </label>
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                defaultValue="60"
                                min="15"
                                step="15"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Recurring Checkbox - Span 12 */}
                        <div className="col-span-12">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isRecurring"
                                    value="true"
                                    className="w-4 h-4 text-blue-600 rounded border-gray-700 bg-gray-900 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-300">Repeats Weekly?</span>
                            </label>
                        </div>

                        {/* Recording Settings & Cover Image Row */}
                        <div className="col-span-12 grid grid-cols-12 gap-4 pt-2 border-t border-gray-800">
                            {/* Recording Controls - Span 8 */}
                            <div className="col-span-12 md:col-span-8">
                                <RecordingControls
                                    recordingEnabled={recordingEnabled}
                                    onRecordingEnabledChange={setRecordingEnabled}
                                    recordingSource={recordingSource}
                                    onRecordingSourceChange={setRecordingSource}
                                    streams={streams}
                                />
                            </div>

                            {/* Cover Image - Span 4 */}
                            <div className="col-span-12 md:col-span-4 space-y-1.5">
                                <label className="block text-sm font-medium text-gray-300">
                                    Cover Image
                                </label>
                                <input type="hidden" name="image" value={imageUrl} />
                                <div className="h-full w-full max-w-xs min-h-[160px]">
                                    <ImageUpload value={imageUrl} onChange={setImageUrl} />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button - Span 12 (but restricted width) */}
                        <div className="col-span-12 pt-4">
                            <button
                                type="submit"
                                className="w-full md:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors shadow-lg hover:shadow-blue-500/20 text-sm"
                            >
                                Create Show
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

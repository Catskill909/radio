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
        <div className="h-screen flex flex-col bg-gray-900">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-gray-800 flex-shrink-0">
                <Link
                    href="/shows"
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold">Create New Show</h1>
            </div>

            {/* Form - Grid Layout */}
            <div className="flex-1 overflow-y-auto p-6">
                <form action={handleSubmit} className="h-full">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-min">
                        {/* Title */}
                        <div className="space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                                Show Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Morning Jazz"
                            />
                        </div>

                        {/* Host */}
                        <div className="space-y-2">
                            <label htmlFor="host" className="block text-sm font-medium text-gray-300">
                                Host
                            </label>
                            <input
                                type="text"
                                id="host"
                                name="host"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. John Smith"
                            />
                        </div>

                        {/* Description - Full Width */}
                        <div className="space-y-2 lg:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Describe the show..."
                            />
                        </div>

                        {/* Show Type - Full Width */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Show Type
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {["Local Podcast", "Syndicated Podcast", "Local Music", "Syndicated Music"].map((type) => (
                                    <label
                                        key={type}
                                        className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type}
                                            required
                                            className="text-blue-600 focus:ring-blue-500 bg-gray-800 border-gray-600 w-4 h-4"
                                        />
                                        <span className="text-sm">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Start Date */}
                        <DateTimePicker
                            selected={startDate}
                            onChange={setStartDate}
                            label="Start Date"
                            required
                            minDate={new Date()}
                        />

                        {/* Start Time */}
                        <DateTimePicker
                            selected={startTime}
                            onChange={setStartTime}
                            label="Start Time"
                            required
                            timeOnly
                            showTimeSelect
                        />

                        {/* Duration */}
                        <div className="space-y-2">
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-300">
                                Duration (minutes)
                            </label>
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                defaultValue="60"
                                min="15"
                                step="15"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Recurring Checkbox */}
                        <div className="space-y-2 flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors w-full">
                                <input
                                    type="checkbox"
                                    name="isRecurring"
                                    value="true"
                                    className="w-5 h-5 text-blue-600 rounded border-gray-700 bg-gray-900 focus:ring-blue-500"
                                />
                                <span className="text-gray-300 font-medium">Repeats Weekly?</span>
                            </label>
                        </div>

                        {/* Recording Controls - Full Width */}
                        <div className="lg:col-span-2">
                            <RecordingControls
                                recordingEnabled={recordingEnabled}
                                onRecordingEnabledChange={setRecordingEnabled}
                                recordingSource={recordingSource}
                                onRecordingSourceChange={setRecordingSource}
                                streams={streams}
                            />
                        </div>

                        {/* Cover Image - Full Width */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Cover Image
                            </label>
                            <input type="hidden" name="image" value={imageUrl} />
                            <ImageUpload value={imageUrl} onChange={setImageUrl} />
                        </div>

                        {/* Submit Button - Full Width */}
                        <div className="lg:col-span-2 pt-4">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg hover:shadow-blue-500/20"
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

'use client'

import { createShow } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { useState } from "react";
import ItunesCategorySelect from "@/components/iTunesCategorySelect";

interface NewShowFormProps {
    streams: { id: string; name: string; url: string }[];
}

export default function NewShowForm({ streams }: NewShowFormProps) {
    const [imageUrl, setImageUrl] = useState("");
    const [categoryValue, setCategoryValue] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Suppress unused variable warning - streams prop kept for future recording source features
    void streams;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Validate required fields
        const newErrors: Record<string, string> = {};

        const title = formData.get("title") as string;
        const type = formData.get("type") as string;

        if (!title || title.trim() === "") {
            newErrors.title = "Show title is required";
        }

        if (!type) {
            newErrors.type = "Please select a show type";
        }

        if (!categoryValue) {
            newErrors.category = "Please select a category";
        }

        // If there are errors, show them and don't submit
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to first error
            const firstErrorField = document.querySelector('[data-error="true"]');
            firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Clear any previous errors
        setErrors({});
        setSubmitError(null);

        try {
            await createShow(formData);
        } catch (error) {
            // Use console.warn so expected business errors (like schedule overlaps) don't trigger the red React error overlay in dev
            console.warn("Failed to create show:", error);
            setSubmitError(error instanceof Error ? error.message : "Failed to create show");
        }
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
                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                    {submitError && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-200 text-sm rounded-md px-4 py-3">
                            {submitError}
                        </div>
                    )}

                    <div className="grid grid-cols-12 gap-4">
                        {/* Title - Span 12 */}
                        <div className="col-span-12 space-y-1.5">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                                Show Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                data-error={!!errors.title}
                                className={`w-full bg-gray-900 border rounded-md px-3 py-2 focus:ring-2 focus:border-transparent outline-none transition-all text-sm ${errors.title
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-700 focus:ring-blue-500'
                                    }`}
                                placeholder="e.g. Morning Jazz"
                            />
                            {errors.title && (
                                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                            )}
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







                        {/* Language - Span 4 */}
                        <div className="col-span-12 md:col-span-4 space-y-1.5">
                            <label htmlFor="language" className="block text-sm font-medium text-gray-300">
                                Language
                            </label>
                            <input
                                type="text"
                                id="language"
                                name="language"
                                defaultValue="en-us"
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
                                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="https://example.com"
                            />
                        </div>



                        {/* Category - Span 4 */}
                        <div className="col-span-12 md:col-span-4 space-y-1.5" data-error={!!errors.category}>
                            <ItunesCategorySelect
                                value={categoryValue}
                                onChange={setCategoryValue}
                                required={true}
                                error={errors.category}
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

                        {/* iTunes Type - Span 12 */}
                        <div className="col-span-12 space-y-1.5">
                            <label htmlFor="itunesType" className="block text-sm font-medium text-gray-300">
                                iTunes Type
                            </label>
                            <select
                                id="itunesType"
                                name="itunesType"
                                defaultValue="episodic"
                                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            >
                                <option value="episodic">Episodic (Default)</option>
                                <option value="serial">Serial</option>
                            </select>
                            <p className="text-xs text-gray-500">
                                Episodic: Newest episodes first. Serial: Oldest episodes first (good for storytelling).
                            </p>
                        </div>

                        {/* Show Type - Span 12 but compact grid inside */}
                        <div className="col-span-12 space-y-1.5">
                            <label className="block text-sm font-medium text-gray-300">
                                Show Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-error={!!errors.type}>
                                {["Local Podcast", "Syndicated Podcast", "Local Music", "Syndicated Music"].map((type) => (
                                    <label
                                        key={type}
                                        className={`flex items-center gap-2 p-2.5 bg-gray-900 border rounded-md cursor-pointer hover:border-gray-500 transition-colors ${errors.type ? 'border-red-500' : 'border-gray-700'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type}
                                            className="text-blue-600 focus:ring-blue-500 bg-gray-800 border-gray-600 w-3.5 h-3.5"
                                        />
                                        <span className="text-xs font-medium">{type}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.type && (
                                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                            )}
                        </div>



                        {/* Cover Image Row */}
                        <div className="col-span-12 pt-2 border-t border-gray-800">
                            <div className="space-y-1.5">
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

                        {/* Submit Button - Span 12 (but restricted width) */}
                        <div className="col-span-12 pt-4">
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-white font-medium transition-all"
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

'use client';

import { useState } from 'react';
import { updateStationStreamAction } from '@/app/actions';
import { Save, Radio, CheckCircle, AlertCircle } from 'lucide-react';
import { IcecastStream } from '@prisma/client';

interface StationStreamFormProps {
    initialStreamUrl: string | null;
    availableStreams: IcecastStream[];
}

export default function StationStreamForm({ initialStreamUrl, availableStreams }: StationStreamFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [selectedStream, setSelectedStream] = useState<string>(initialStreamUrl || "");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent form navigation

        setIsSaving(true);
        setStatus(null);

        try {
            const formData = new FormData(e.currentTarget);
            await updateStationStreamAction(formData);
            setStatus({ type: 'success', message: 'Stream setting saved successfully!' });

            // Clear success message after 5 seconds
            setTimeout(() => setStatus(null), 5000);
        } catch (error) {
            console.error('Failed to save stream setting:', error);
            setStatus({
                type: 'error',
                message: 'Failed to save stream setting. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 h-fit relative">
            <div>
                <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-green-400" />
                    Station Audio Stream
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    Select the Icecast stream to play on the public Listen page.{' '}
                    <a
                        href="/streams"
                        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                    >
                        Manage streams →
                    </a>
                </p>
            </div>

            {status && (
                <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${status.type === 'success'
                    ? 'bg-gray-900 border-green-500/50 text-green-400'
                    : 'bg-gray-900 border-red-500/50 text-red-400'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="font-medium">{status.message}</p>
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="streamUrl" className="block text-sm font-medium text-gray-300">
                    Active Stream
                </label>
                <select
                    id="streamUrl"
                    name="streamUrl"
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                    <option value="">-- No Stream Selected --</option>
                    {availableStreams
                        .filter((stream) => stream.isEnabled)
                        .map((stream) => (
                            <option key={stream.id} value={stream.url}>
                                {stream.name} ({stream.url})
                            </option>
                        ))}
                </select>
            </div>

            <div className="pt-2 border-t border-gray-800">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-green-500/50 hover:border-green-500 bg-transparent hover:bg-green-500/5 text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Stream
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

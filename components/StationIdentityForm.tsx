'use client';

import { useState } from 'react';
import { updateStationIdentityAction } from '@/app/actions';
import ImageUpload from './ImageUpload';
import { Save, Radio, Mail, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

interface StationIdentityFormProps {
    initialSettings: {
        name: string | null;
        description: string | null;
        email: string | null;
        logoUrl: string | null;
    };
}

export default function StationIdentityForm({ initialSettings }: StationIdentityFormProps) {
    const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true);
        setStatus(null);

        // Append the logo URL from state since it's not a standard input
        formData.set('logoUrl', logoUrl);

        try {
            await updateStationIdentityAction(formData);
            setStatus({ type: 'success', message: 'Settings saved successfully!' });

            // Clear success message after 5 seconds
            setTimeout(() => setStatus(null), 5000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setStatus({
                type: 'error',
                message: 'Failed to save settings. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form action={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6 h-fit relative">
            <div>
                <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-blue-400" />
                    Station Identity
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    Configure how your station appears in RSS feeds and public pages.
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

            <div className="space-y-4">
                {/* Station Name */}
                <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                        Station Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={initialSettings.name || ''}
                        placeholder="My Radio Station"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                    />
                </div>

                {/* Description / Tagline */}
                <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        Description / Tagline
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        defaultValue={initialSettings.description || ''}
                        placeholder="The best music in the world..."
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 resize-none"
                    />
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        Contact Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={initialSettings.email || ''}
                        placeholder="contact@station.com"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                    />
                    <p className="text-xs text-gray-500">Used as the owner email for podcast feeds.</p>
                </div>

                {/* Station Artwork */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        Default Artwork
                    </label>
                    <div className="mt-1">
                        <ImageUpload value={logoUrl} onChange={setLogoUrl} />
                    </div>
                    <p className="text-xs text-gray-500">Fallback image for shows without their own cover art.</p>
                </div>
            </div>

            <div className="pt-2 border-t border-gray-800">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Identity
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

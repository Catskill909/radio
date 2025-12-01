'use client';

import { useState, useTransition } from 'react';
import { updateStationSettings } from '@/app/actions';

import Switch from './Switch';
import SiteLogoUpload from './SiteLogoUpload';

interface SiteBrandingFormProps {
    initialSettings: {
        siteLogo?: string | null;
        siteTitle?: string | null;
        siteTagline?: string | null;
        showSiteLogo?: boolean;
        showSiteTitle?: boolean;
        showSiteTagline?: boolean;
    };
}

export default function SiteBrandingForm({ initialSettings }: SiteBrandingFormProps) {
    const [siteLogo, setSiteLogo] = useState(initialSettings.siteLogo || '');
    const [siteTitle, setSiteTitle] = useState(initialSettings.siteTitle || '');
    const [siteTagline, setSiteTagline] = useState(initialSettings.siteTagline || '');
    const [showSiteLogo, setShowSiteLogo] = useState(initialSettings.showSiteLogo ?? true);
    const [showSiteTitle, setShowSiteTitle] = useState(initialSettings.showSiteTitle ?? true);
    const [showSiteTagline, setShowSiteTagline] = useState(initialSettings.showSiteTagline ?? true);

    const [isPending, startTransition] = useTransition();
    const [saveMessage, setSaveMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveMessage('');

        const formData = new FormData();
        formData.append('siteLogo', siteLogo);
        formData.append('siteTitle', siteTitle);
        formData.append('siteTagline', siteTagline);
        formData.append('showSiteLogo', showSiteLogo.toString());
        formData.append('showSiteTitle', showSiteTitle.toString());
        formData.append('showSiteTagline', showSiteTagline.toString());

        startTransition(async () => {
            try {
                await updateStationSettings(formData);
                setSaveMessage('Site branding settings saved successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
            } catch (error) {
                setSaveMessage('Error saving settings. Please try again.');
                console.error(error);
            }
        });
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Title and Tagline (60%) */}
                    <div className="flex-1 space-y-8">
                        {/* Site Title */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-base font-medium text-gray-200">
                                    Site Title
                                </label>
                                <Switch
                                    checked={showSiteTitle}
                                    onChange={setShowSiteTitle}
                                    label="Show Title"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={siteTitle}
                                    onChange={(e) => setSiteTitle(e.target.value)}
                                    placeholder="My Radio Station"
                                    maxLength={60}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {siteTitle && (
                                    <div className="mt-3 p-4 bg-black/20 rounded border border-gray-800">
                                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Preview</p>
                                        <h2
                                            className="text-3xl font-bold text-white"
                                            style={{ fontFamily: 'Oswald, sans-serif' }}
                                        >
                                            {siteTitle}
                                        </h2>
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-gray-500 text-right">
                                    {siteTitle.length}/60
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-800" />

                        {/* Site Tagline */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-base font-medium text-gray-200">
                                    Site Tagline
                                </label>
                                <Switch
                                    checked={showSiteTagline}
                                    onChange={setShowSiteTagline}
                                    label="Show Tagline"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={siteTagline}
                                    onChange={(e) => setSiteTagline(e.target.value)}
                                    placeholder="Your favorite music, 24/7"
                                    maxLength={100}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {siteTagline && (
                                    <div className="mt-3 p-4 bg-black/20 rounded border border-gray-800">
                                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Preview</p>
                                        <p className="text-sm text-gray-300">
                                            {siteTagline}
                                        </p>
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-gray-500 text-right">
                                    {siteTagline.length}/100
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Site Logo (40%) */}
                    <div className="w-full lg:w-96 flex-shrink-0 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-base font-medium text-gray-200">
                                Site Logo
                            </label>
                            <Switch
                                checked={showSiteLogo}
                                onChange={setShowSiteLogo}
                                label="Show Logo"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="w-full aspect-video">
                                <SiteLogoUpload
                                    value={siteLogo}
                                    onChange={setSiteLogo}
                                />
                            </div>

                            <div className="w-full">
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Image URL
                                </label>
                                <input
                                    type="text"
                                    value={siteLogo}
                                    onChange={(e) => setSiteLogo(e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Upload an image or paste a URL. Images larger than 2400px will be automatically resized.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Saving...' : 'Save Branding Settings'}
                    </button>
                    {saveMessage && (
                        <span
                            className={`text-sm font-medium animate-fade-in ${saveMessage.includes('Error')
                                    ? 'text-red-400'
                                    : 'text-green-400'
                                }`}
                        >
                            {saveMessage}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}

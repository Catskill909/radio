'use client';

import { useState, useRef } from 'react';
import { updateAcrcloudSettings, updateAcrcloudLimit } from '@/app/actions';
import { Check, Music, Play, Pause, Search, AlertCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Switch from './Switch';
import { IcecastStream } from '@prisma/client';
import HelpIcon from './HelpIcon';

interface ACRCloudSettingsProps {
    initialSettings: {
        enabled: boolean;
        host: string;
        accessKey: string;
        accessSecret: string;
        envConfigured: boolean;
        monthlyLimit: number;
        requestCount: number;
        resetDate: string | null;
    };
    availableStreams: IcecastStream[];
}

interface IdentifiedSong {
    title: string;
    artist: string;
    album?: string;
    coverArt?: string;
    identifiedAt: string;
}

// Common ACRCloud host options
const HOST_OPTIONS = [
    { value: 'identify-us-west-2.acrcloud.com', label: 'US West (Oregon)' },
    { value: 'identify-eu-west-1.acrcloud.com', label: 'EU West (Ireland)' },
    { value: 'identify-ap-southeast-1.acrcloud.com', label: 'Asia Pacific (Singapore)' },
    { value: 'identify-ap-northeast-1.acrcloud.com', label: 'Asia Pacific (Tokyo)' },
];

export default function ACRCloudSettings({ initialSettings, availableStreams }: ACRCloudSettingsProps) {
    // Form state
    const [enabled, setEnabled] = useState(initialSettings.enabled);
    const [host, setHost] = useState(initialSettings.host || HOST_OPTIONS[0].value);
    const [accessKey, setAccessKey] = useState(initialSettings.accessKey);
    const [accessSecret, setAccessSecret] = useState(initialSettings.accessSecret);
    const [showKey, setShowKey] = useState(false);
    const [showSecret, setShowSecret] = useState(false);

    // Test state
    const [testStreamUrl, setTestStreamUrl] = useState(availableStreams[0]?.url || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [identifiedSong, setIdentifiedSong] = useState<IdentifiedSong | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Save state
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Usage tracking state
    const [requestCount, setRequestCount] = useState(initialSettings.requestCount);
    const [monthlyLimit, setMonthlyLimit] = useState(initialSettings.monthlyLimit);
    const [limitReached, setLimitReached] = useState(false);

    // Audio ref
    const audioRef = useRef<HTMLAudioElement>(null);

    // Track unsaved changes
    const hasChanges =
        enabled !== initialSettings.enabled ||
        host !== (initialSettings.host || HOST_OPTIONS[0].value) ||
        accessKey !== initialSettings.accessKey ||
        accessSecret !== initialSettings.accessSecret;

    // Handle save
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateAcrcloudSettings(enabled, host, accessKey, accessSecret);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle play/pause
    const togglePlay = () => {
        if (!audioRef.current || !testStreamUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.src = '';
            setIsPlaying(false);
        } else {
            audioRef.current.src = testStreamUrl;
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => setError('Failed to play stream'));
        }
    };

    // Handle identify
    const handleIdentify = async () => {
        if (!testStreamUrl) {
            setError('Please select a stream first');
            return;
        }

        if (limitReached) {
            setError(`Monthly limit reached (${requestCount}/${monthlyLimit}). Increase limit or wait until next month.`);
            return;
        }

        setIsIdentifying(true);
        setError(null);
        setIdentifiedSong(null);

        try {
            const response = await fetch('/api/acrcloud/identify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ streamUrl: testStreamUrl }),
            });

            const result = await response.json();

            // Update usage count from response
            if (result.usage) {
                setRequestCount(result.usage.count);
                if (result.usage.count >= result.usage.limit) {
                    setLimitReached(true);
                }
            }

            if (result.limitReached) {
                setLimitReached(true);
                setError(result.error || 'Monthly limit reached');
            } else if (result.success && result.song) {
                setIdentifiedSong(result.song);
            } else {
                setError(result.error || 'Song not recognized');
            }
        } catch (err) {
            setError('Failed to identify song');
        } finally {
            setIsIdentifying(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Music className="w-6 h-6 text-purple-400" />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-100">ACRCloud Song Recognition</h2>
                        <p className="text-sm text-gray-400">
                            Automatically identify songs playing on your stream.{' '}
                            <a
                                href="https://console.acrcloud.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                            >
                                Get API credentials →
                            </a>
                        </p>
                    </div>
                </div>
                <HelpIcon articleId="song-recognition" tooltip="Learn how to set up song recognition" />
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center justify-between py-4 border-b border-gray-800">
                <div>
                    <p className="font-medium text-gray-200">Enable Song Recognition</p>
                    <p className="text-sm text-gray-500">Identify songs on your audio stream</p>
                </div>
                <Switch checked={enabled} onChange={setEnabled} />
            </div>

            {/* Usage Meter */}
            {enabled && (
                <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Monthly Usage</span>
                        <span className="text-sm text-gray-400">
                            {requestCount} / {monthlyLimit} requests
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mb-3">
                        <div
                            className={`h-2.5 rounded-full transition-all ${requestCount >= monthlyLimit
                                    ? 'bg-red-500'
                                    : requestCount >= monthlyLimit * 0.8
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                }`}
                            style={{ width: `${Math.min(100, (requestCount / monthlyLimit) * 100)}%` }}
                        />
                    </div>

                    {/* Limit Exceeded Warning */}
                    {requestCount >= monthlyLimit && (
                        <div className="flex items-center gap-2 text-red-400 text-xs mb-3">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Limit reached! Increase limit below or wait until next month.</span>
                        </div>
                    )}

                    {/* Warning at 80% */}
                    {requestCount >= monthlyLimit * 0.8 && requestCount < monthlyLimit && (
                        <div className="flex items-center gap-2 text-yellow-400 text-xs mb-3">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Approaching monthly limit ({Math.round((requestCount / monthlyLimit) * 100)}% used)</span>
                        </div>
                    )}

                    {/* Limit Input */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-400">Monthly limit:</label>
                        <input
                            type="number"
                            value={monthlyLimit}
                            onChange={(e) => setMonthlyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max="10000"
                            className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                            onClick={async () => {
                                await updateAcrcloudLimit(monthlyLimit);
                                // Reset limitReached if we've increased the limit above current count
                                if (monthlyLimit > requestCount) {
                                    setLimitReached(false);
                                }
                            }}
                            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors cursor-pointer"
                        >
                            Update
                        </button>
                        <span className="text-xs text-gray-500">
                            ≈ ${((monthlyLimit / 1000) * 5.40).toFixed(2)}/mo max
                        </span>
                    </div>
                </div>
            )}

            {/* Environment Variables Notice OR Credentials Form */}
            {initialSettings.envConfigured ? (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-800/30 rounded-lg flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-green-300 font-medium">Credentials configured via environment variables</p>
                        <p className="text-xs text-green-400/70 mt-1">
                            API keys are securely set in your server environment. No configuration needed here.
                        </p>
                    </div>
                </div>
            ) : (
                /* Credentials Section - only shown when not using env vars */
                <div className={`mt-6 space-y-4 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-sm font-medium text-gray-300">API Credentials</h3>

                    {/* Host + Access Key (2-column grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Host Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">
                                Host Region
                            </label>
                            <select
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {HOST_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Access Key */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">
                                Access Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={accessKey}
                                    onChange={(e) => setAccessKey(e.target.value)}
                                    placeholder="Your ACRCloud access key"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-12 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                                >
                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Access Secret (full width with show/hide) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            Access Secret
                        </label>
                        <div className="relative">
                            <input
                                type={showSecret ? 'text' : 'password'}
                                value={accessSecret}
                                onChange={(e) => setAccessSecret(e.target.value)}
                                placeholder="Your ACRCloud access secret"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-12 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                            >
                                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-800 my-6" />

            {/* Test Section */}
            <div className={`space-y-4 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="text-sm font-medium text-gray-300">Test Song Recognition</h3>

                {/* Stream Selector + Controls */}
                <div className="flex flex-wrap items-end gap-3">
                    {/* Stream Dropdown */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            Test Stream
                        </label>
                        <select
                            value={testStreamUrl}
                            onChange={(e) => setTestStreamUrl(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">-- Select a stream --</option>
                            {availableStreams.map((stream) => (
                                <option key={stream.id} value={stream.url}>
                                    {stream.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlay}
                        disabled={!testStreamUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors cursor-pointer"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>

                    {/* Identify Button */}
                    <button
                        onClick={handleIdentify}
                        disabled={!testStreamUrl || isIdentifying || (!initialSettings.envConfigured && (!accessKey || !accessSecret))}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors cursor-pointer"
                    >
                        <Search className="w-4 h-4" />
                        {isIdentifying ? 'Identifying...' : 'Identify Song'}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                {/* Identified Song Display */}
                {identifiedSong && (
                    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex items-start gap-4">
                        {/* Cover Art */}
                        <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                            {identifiedSong.coverArt ? (
                                <img
                                    src={identifiedSong.coverArt}
                                    alt="Album cover"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Music className="w-8 h-8 text-gray-500" />
                                </div>
                            )}
                        </div>

                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-100 truncate">{identifiedSong.title}</p>
                            <p className="text-sm text-gray-400 truncate">{identifiedSong.artist}</p>
                            {identifiedSong.album && (
                                <p className="text-xs text-gray-500 truncate mt-1">
                                    Album: {identifiedSong.album}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Identified: {new Date(identifiedSong.identifiedAt).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                )}

                {/* Hidden Audio Element */}
                <audio ref={audioRef} className="hidden" />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800 my-6" />

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${saved
                        ? 'bg-green-600 text-white'
                        : hasChanges
                            ? 'bg-purple-600 hover:bg-purple-700 text-white animate-pulse'
                            : 'border border-gray-700 hover:border-gray-600 bg-transparent hover:bg-gray-800 text-white'
                        }`}
                >
                    {saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved
                        </>
                    ) : isSaving ? (
                        'Saving...'
                    ) : hasChanges ? (
                        'Save Settings *'
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>
        </div>
    );
}

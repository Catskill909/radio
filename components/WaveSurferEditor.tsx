'use client'

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import { Play, Pause, ZoomIn, ZoomOut, Scissors, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface WaveSurferEditorProps {
    audioUrl: string;
    filename: string;
    onSave?: (newDuration: number) => void;
    onClose?: () => void;
}

export default function WaveSurferEditor({ audioUrl, filename, onSave, onClose }: WaveSurferEditorProps) {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [hasRegion, setHasRegion] = useState(false);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!waveformRef.current) return;

        // Create regions plugin
        const regions = RegionsPlugin.create();
        regionsRef.current = regions;

        // Create timeline plugin
        const timeline = TimelinePlugin.create({
            container: '#timeline',
        });

        // Initialize WaveSurfer
        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4a5568',
            progressColor: '#3b82f6',
            cursorColor: '#60a5fa',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 128,
            normalize: true,
            plugins: [regions, timeline],
        });

        wavesurferRef.current = wavesurfer;

        // Load audio
        wavesurfer.load(audioUrl);

        // Event listeners
        wavesurfer.on('ready', () => {
            setIsLoading(false);
            setDuration(wavesurfer.getDuration());
            setError(null); // Clear any errors when audio loads successfully
        });

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));

        wavesurfer.on('timeupdate', (time) => {
            setCurrentTime(time);
        });

        wavesurfer.on('error', (err) => {
            console.error('WaveSurfer error:', err);
            // Only show error if we're not in cleanup (avoid React Strict Mode noise)
            if (!err.message?.includes('aborted')) {
                setError(`Failed to load audio file. Please check the file exists and is a valid audio format.`);
            }
            setIsLoading(false);
        });

        // Track region changes
        regions.on('region-created', () => {
            setHasRegion(true);
        });

        regions.on('region-removed', () => {
            setHasRegion(regions.getRegions().length > 0);
        });

        // Cleanup
        return () => {
            try {
                wavesurfer.destroy();
            } catch (err) {
                // Ignore cleanup errors in development (React Strict Mode double cleanup)
                // This is expected behavior and safe to ignore
            }
        };
    }, [audioUrl]);

    // Update zoom
    useEffect(() => {
        if (wavesurferRef.current && !isLoading) {
            // Only apply zoom if audio is loaded
            try {
                wavesurferRef.current.zoom(zoom);
            } catch (err) {
                // Silently ignore zoom errors during initialization
                console.warn('Zoom not applied:', err);
            }
        }
    }, [zoom, isLoading]);

    const togglePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 50, 500));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 50, 1));
    };

    const createTrimRegion = () => {
        if (!regionsRef.current || !wavesurferRef.current) return;

        // Clear existing regions
        regionsRef.current.clearRegions();

        // Create a region in the middle 50% of the audio
        const duration = wavesurferRef.current.getDuration();
        const start = duration * 0.25;
        const end = duration * 0.75;

        regionsRef.current.addRegion({
            start,
            end,
            color: 'rgba(59, 130, 246, 0.3)',
            drag: true,
            resize: true,
        });
    };

    const handleTrim = async () => {
        if (!regionsRef.current) {
            setError('No region selected for trimming');
            return;
        }

        const regions = regionsRef.current.getRegions();
        if (regions.length === 0) {
            setError('Please create a region to trim by clicking "Create Trim Region"');
            return;
        }

        const region = regions[0];
        const startTime = region.start;
        const endTime = region.end;

        if (startTime >= endTime) {
            setError('Invalid trim region');
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/trim-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename,
                    startTime,
                    endTime,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to trim audio');
            }

            setSuccess(`Audio trimmed successfully! New duration: ${Math.round(data.duration)}s. Backup saved as: ${data.backupPath}`);

            // Notify parent component
            if (onSave) {
                onSave(data.duration);
            }

            // Reload the waveform after a short delay
            setTimeout(() => {
                if (wavesurferRef.current) {
                    wavesurferRef.current.load(audioUrl + '?t=' + Date.now()); // Cache bust
                }
            }, 1000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to trim audio');
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Main Editor */}
            <div className="flex-1 p-6 overflow-auto">
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Controls */}
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <button
                        onClick={togglePlayPause}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>

                    <button
                        onClick={handleZoomIn}
                        disabled={isLoading}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleZoomOut}
                        disabled={isLoading}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>

                    <button
                        onClick={createTrimRegion}
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Scissors className="w-4 h-4" />
                        Create Trim Region
                    </button>

                    <div className="ml-auto text-sm text-gray-400">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-400">Loading waveform...</span>
                    </div>
                )}

                {/* Waveform Container */}
                <div className={`bg-gray-800 rounded-lg p-4 ${isLoading ? 'hidden' : ''}`}>
                    <div ref={waveformRef} className="mb-2" />
                    <div id="timeline" />
                </div>

                {/* Instructions */}
                {!isLoading && (
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg text-sm text-gray-300">
                        <p className="font-semibold mb-2">How to trim:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Click "Create Trim Region" to add a selection region</li>
                            <li>Drag the edges of the blue region to adjust trim points</li>
                            <li>Click "Trim & Save" to apply (original file will be backed up)</li>
                        </ol>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 flex gap-3">
                <button
                    onClick={handleTrim}
                    disabled={isSaving || isLoading || !hasRegion}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                    {isSaving && <Loader className="w-5 h-5 animate-spin" />}
                    {isSaving ? 'Trimming...' : 'Trim & Save'}
                </button>

                {onClose && (
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
}

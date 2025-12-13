'use client'

import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.js';
import Minimap from 'wavesurfer.js/dist/plugins/minimap.js';
import PeakMeter from './PeakMeter';
import AnalogVUMeter from './AnalogVUMeter';
import MeterToggle from './MeterToggle';
import NormalizeModal from './NormalizeModal';
import { Play, Pause, ZoomIn, ZoomOut, Maximize2, X, Volume2, Keyboard, Repeat, Crop, Trash2, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface WaveSurferEditorProps {
    audioUrl: string;
    filename: string;
    onSave?: (newDuration: number) => void;
    onClose?: () => void;
}

interface SelectionInfo {
    start: number;
    end: number;
    duration: number;
}

// Processing operation type for UI feedback
type ProcessingOperation = 'keep' | 'delete' | 'fade' | 'normalize' | null;

export default function WaveSurferEditor({ audioUrl, filename, onSave, onClose }: WaveSurferEditorProps) {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);
    const activeRegionRef = useRef<any>(null);
    const isLoopingRef = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [processingOperation, setProcessingOperation] = useState<ProcessingOperation>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [zoom, setZoom] = useState<number | null>(null); // null = fit to container, number = pixels per second
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [selection, setSelection] = useState<SelectionInfo | null>(null);
    const [isLooping, setIsLooping] = useState(false);
    const [fadeDuration, setFadeDuration] = useState(3); // User-controlled fade duration in seconds
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [showNormalizeModal, setShowNormalizeModal] = useState(false);

    // Peak meter audio nodes
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [sourceNode, setSourceNode] = useState<AudioNode | null>(null);

    // Meter view state
    const [meterView, setMeterView] = useState<'peak' | 'vu' | 'none'>('peak');

    // Format time as mm:ss
    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Update selection state from active region
    const updateSelectionFromRegion = useCallback((region: any) => {
        if (region) {
            setSelection({
                start: region.start,
                end: region.end,
                duration: region.end - region.start,
            });
        } else {
            setSelection(null);
        }
    }, []);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!waveformRef.current) return;

        let isMounted = true;

        // Create plugins
        const regions = RegionsPlugin.create();
        regionsRef.current = regions;

        const timeline = TimelinePlugin.create({
            container: '#timeline',
        });

        const hover = HoverPlugin.create({
            lineColor: '#60a5fa',
            lineWidth: 2,
            labelBackground: '#1f2937',
            labelColor: '#fff',
            labelSize: '12px',
        });

        // Minimap for navigation overview
        const minimap = Minimap.create({
            height: 30,
            waveColor: '#6b7280',
            progressColor: '#3b82f6',
            container: '#minimap',
        });

        // Initialize WaveSurfer
        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4a5568',
            progressColor: '#3b82f6',
            cursorColor: '#ffffff',
            cursorWidth: 2,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 128,
            normalize: true,
            fillParent: true, // Fit entire waveform in container
            minPxPerSec: 1,
            plugins: [regions, timeline, hover, minimap],
        });

        wavesurferRef.current = wavesurfer;

        // Load audio
        wavesurfer.load(audioUrl).catch((err) => {
            if (err?.name === 'AbortError') return;
            console.error('WaveSurfer load error:', err);
        });

        // Event listeners
        wavesurfer.on('ready', () => {
            if (!isMounted) return;
            setIsLoading(false);
            const audioDuration = wavesurfer.getDuration();
            setDuration(audioDuration);
            setError(null);

            // Get audio context and media element for peak meter
            try {
                const mediaElement = wavesurfer.getMediaElement();
                if (mediaElement && !audioContext) {
                    // Create our own AudioContext for the peak meter
                    const ctx = new AudioContext();
                    setAudioContext(ctx);

                    // Create source from media element
                    const source = ctx.createMediaElementSource(mediaElement);

                    // Connect to destination so audio plays
                    source.connect(ctx.destination);

                    setSourceNode(source);
                    console.log('Peak meter initialized successfully');
                }
            } catch (err) {
                console.warn('Could not initialize peak meter:', err);
            }

            // FORCE fit waveform to container by calculating exact pixels per second
            if (waveformRef.current && audioDuration > 0) {
                const containerWidth = waveformRef.current.clientWidth;
                const fitZoom = containerWidth / audioDuration;
                wavesurfer.zoom(fitZoom);
            }

            // Enable drag selection after ready - use green for contrast with blue progress
            regions.enableDragSelection({
                color: 'rgba(34, 197, 94, 0.35)',
            });
        });

        wavesurfer.on('play', () => isMounted && setIsPlaying(true));
        wavesurfer.on('pause', () => isMounted && setIsPlaying(false));
        wavesurfer.on('finish', () => isMounted && setIsPlaying(false));

        wavesurfer.on('timeupdate', (time) => {
            if (!isMounted) return;
            setCurrentTime(time);

            // Handle looping within selection (use ref to avoid stale closure)
            if (isLoopingRef.current && activeRegionRef.current) {
                const region = activeRegionRef.current;
                if (time >= region.end) {
                    wavesurfer.setTime(region.start);
                    wavesurfer.play();
                }
            }
        });

        wavesurfer.on('error', (err) => {
            if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return;
            console.error('WaveSurfer error:', err);
            if (isMounted) {
                setError(`Failed to load audio file. Please check the file exists and is a valid audio format.`);
                setIsLoading(false);
            }
        });

        // Region events
        regions.on('region-created', (region) => {
            if (!isMounted) return;

            // Only allow one region at a time - remove previous
            const allRegions = regions.getRegions();
            allRegions.forEach((r) => {
                if (r.id !== region.id) {
                    r.remove();
                }
            });

            activeRegionRef.current = region;
            updateSelectionFromRegion(region);
        });

        regions.on('region-updated', (region) => {
            if (!isMounted) return;
            activeRegionRef.current = region;
            updateSelectionFromRegion(region);
        });

        regions.on('region-removed', () => {
            if (!isMounted) return;
            activeRegionRef.current = null;
            setSelection(null);
            setIsLooping(false);
        });

        // Click on region to play from that position
        regions.on('region-clicked', (region, e) => {
            e.stopPropagation();
            // Calculate click position within region
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickPercent = clickX / rect.width;
            const clickTime = region.start + (region.end - region.start) * clickPercent;
            wavesurfer.setTime(clickTime);
        });

        // Double-click region to play selection
        regions.on('region-double-clicked', (region, e) => {
            e.stopPropagation();
            wavesurfer.setTime(region.start);
            wavesurfer.play();
        });

        // Cleanup
        return () => {
            isMounted = false;
            try {
                wavesurfer.destroy();
            } catch (err) {
                // Ignore cleanup errors
            }
        };
    }, [audioUrl, updateSelectionFromRegion]);

    // Handle looping state changes
    useEffect(() => {
        if (!wavesurferRef.current || !activeRegionRef.current) return;

        if (isLooping) {
            const region = activeRegionRef.current;
            wavesurferRef.current.setTime(region.start);
            wavesurferRef.current.play();
        }
    }, [isLooping]);

    // Apply zoom only when explicitly set (not on initial load)
    useEffect(() => {
        if (wavesurferRef.current && !isLoading && zoom !== null) {
            try {
                wavesurferRef.current.zoom(zoom);
            } catch (err) {
                console.warn('Zoom error:', err);
            }
        }
    }, [zoom, isLoading]);

    // Zoom controls - start from current view when first zooming
    const handleZoomIn = () => {
        if (zoom === null) {
            // First zoom: calculate current pixels per second from container width
            const container = waveformRef.current;
            if (container && duration > 0) {
                const currentPxPerSec = container.clientWidth / duration;
                setZoom(Math.min(currentPxPerSec * 1.5, 200));
            } else {
                setZoom(10); // fallback
            }
        } else {
            setZoom(prev => Math.min((prev || 1) * 1.5, 200));
        }
    };
    const handleZoomOut = () => {
        if (zoom === null || zoom <= 1) return;
        setZoom(prev => Math.max((prev || 1) / 1.5, 1));
    };
    const handleZoomFit = () => setZoom(null); // null = let fillParent work

    const togglePlayPause = () => {
        if (wavesurferRef.current) {
            if (isLooping) setIsLooping(false);
            wavesurferRef.current.playPause();
        }
    };

    const clearSelection = () => {
        if (regionsRef.current) {
            regionsRef.current.clearRegions();
        }
        setIsLooping(false);
        isLoopingRef.current = false;
    };

    const playSelection = () => {
        if (!wavesurferRef.current || !activeRegionRef.current) return;

        // If already playing, pause instead
        if (isPlaying) {
            wavesurferRef.current.pause();
            return;
        }

        const region = activeRegionRef.current;
        wavesurferRef.current.setTime(region.start);
        wavesurferRef.current.play();
    };

    const toggleLoop = () => {
        if (!selection) return;
        const newLooping = !isLooping;
        setIsLooping(newLooping);
        isLoopingRef.current = newLooping;

        // If turning on looping, start playing from selection start
        if (newLooping && wavesurferRef.current && activeRegionRef.current) {
            wavesurferRef.current.setTime(activeRegionRef.current.start);
            wavesurferRef.current.play();
        }
    };

    // Keep selection (trim to selection)
    const handleKeepSelection = async () => {
        if (!selection) {
            setError('Please select a region first by clicking and dragging on the waveform');
            return;
        }

        setIsSaving(true);
        setProcessingOperation('keep');
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/trim-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename,
                    startTime: selection.start,
                    endTime: selection.end,
                    mode: 'keep',
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to process audio');
            }

            setSuccess(`Kept selected portion (${formatTime(selection.duration)}). New duration: ${formatTime(data.duration)}. Backup saved.`);
            clearSelection();

            if (onSave) onSave(data.duration);

            // Reload waveform with loading state
            setTimeout(() => {
                if (wavesurferRef.current) {
                    setIsLoading(true);
                    wavesurferRef.current.load(audioUrl + '?t=' + Date.now());
                }
            }, 500);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process audio');
        } finally {
            setIsSaving(false);
            setProcessingOperation(null);
        }
    };

    // Delete selection (remove selection, keep rest)
    const handleDeleteSelection = async () => {
        if (!selection) {
            setError('Please select a region first by clicking and dragging on the waveform');
            return;
        }

        setIsSaving(true);
        setProcessingOperation('delete');
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/trim-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename,
                    startTime: selection.start,
                    endTime: selection.end,
                    mode: 'delete',
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to process audio');
            }

            setSuccess(`Deleted selected portion (${formatTime(selection.duration)}). New duration: ${formatTime(data.duration)}. Backup saved.`);
            clearSelection();

            if (onSave) onSave(data.duration);

            // Reload waveform with loading state
            setTimeout(() => {
                if (wavesurferRef.current) {
                    setIsLoading(true);
                    wavesurferRef.current.load(audioUrl + '?t=' + Date.now());
                }
            }, 500);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process audio');
        } finally {
            setIsSaving(false);
            setProcessingOperation(null);
        }
    };

    const handleProcessAudio = async (operation: 'fade' | 'normalize', parameters: any = {}) => {
        setIsSaving(true);
        setProcessingOperation(operation);
        setError(null);
        setSuccess(null);

        try {
            // For normalize, include selection range if exists
            const body: any = {
                filename,
                operation,
                parameters,
            };

            // If there's a selection, pass the range for targeted processing
            if (selection && operation === 'normalize') {
                body.startTime = selection.start;
                body.endTime = selection.end;
            }

            const response = await fetch('/api/process-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || `Failed to ${operation} audio`);
            }

            const scopeText = selection && operation === 'normalize' ? 'selection' : 'audio';
            setSuccess(`${scopeText.charAt(0).toUpperCase() + scopeText.slice(1)} ${operation === 'fade' ? 'fades applied' : 'normalized'}! Backup saved.`);

            if (onSave) onSave(data.duration);

            // Reload audio to show changes
            setTimeout(() => {
                if (wavesurferRef.current) {
                    setIsLoading(true);
                    clearSelection();
                    wavesurferRef.current.load(audioUrl + '?t=' + Date.now());
                }
            }, 500);

        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to ${operation} audio`);
        } finally {
            setIsSaving(false);
            setProcessingOperation(null);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'ArrowLeft':
                    if (wavesurferRef.current) wavesurferRef.current.skip(-5);
                    break;
                case 'ArrowRight':
                    if (wavesurferRef.current) wavesurferRef.current.skip(5);
                    break;
                case 'l':
                case 'L':
                    if (selection) toggleLoop();
                    break;
                case 'Escape':
                    clearSelection();
                    break;
                case '?':
                    setShowKeyboardHelp(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selection]);

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Main Editor - use min-h-0 and overflow-y-auto to ensure scrolling */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-800 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="ml-auto p-1 hover:bg-green-800 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Processing Status */}
                {isSaving && (
                    <div className="mb-4 p-3 bg-blue-900/50 border border-blue-700 rounded-lg flex items-center gap-2 text-blue-200">
                        <Loader className="w-5 h-5 flex-shrink-0 animate-spin" />
                        <div className="flex flex-col">
                            <span>
                                {processingOperation === 'keep' && 'Cropping audio to selection...'}
                                {processingOperation === 'delete' && 'Cutting selection from audio...'}
                                {processingOperation === 'fade' && 'Applying fade effects...'}
                                {processingOperation === 'normalize' && (selection ? 'Normalizing selection...' : 'Normalizing entire file...')}
                            </span>
                            <span className="text-xs text-blue-300">Large files may take a minute or more to process</span>
                        </div>
                    </div>
                )}

                {/* Playback Controls */}
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <button
                        onClick={togglePlayPause}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-gray-800 rounded-lg border border-gray-700 px-2 py-1">
                        <button
                            onClick={handleZoomOut}
                            disabled={isLoading || zoom === null || zoom <= 1}
                            className="p-1.5 hover:bg-gray-700 disabled:opacity-50 rounded"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleZoomFit}
                            disabled={isLoading || zoom === null}
                            className="px-2 py-1 text-xs hover:bg-gray-700 disabled:opacity-50 rounded"
                            title="Fit to View"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleZoomIn}
                            disabled={isLoading || (zoom !== null && zoom >= 200)}
                            className="p-1.5 hover:bg-gray-700 disabled:opacity-50 rounded"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-gray-700 mx-1" />

                    {/* Selection Controls */}
                    <button
                        onClick={playSelection}
                        disabled={isLoading || !selection}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border ${isPlaying && selection
                            ? 'bg-amber-900/50 border-amber-500 text-amber-300'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white'
                            }`}
                        title={isPlaying ? 'Pause playback' : 'Play from selection start'}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Play Selection'}
                    </button>

                    <button
                        onClick={toggleLoop}
                        disabled={isLoading || !selection}
                        className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border ${isLooping
                            ? 'bg-green-900/50 border-green-500 text-green-300'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white'
                            }`}
                        title="Loop selection (L)"
                    >
                        <Repeat className="w-4 h-4" />
                        {isLooping ? 'Looping' : 'Loop'}
                    </button>

                    <button
                        onClick={clearSelection}
                        disabled={isLoading || !selection}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                        title="Clear selection (Esc)"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>

                    <div className="w-px h-8 bg-gray-700 mx-1" />

                    {/* Normalize Button */}
                    <button
                        onClick={() => setShowNormalizeModal(true)}
                        disabled={isLoading || isSaving}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                        title={selection ? 'Normalize selection volume' : 'Normalize entire file volume'}
                    >
                        <Volume2 className="w-4 h-4" />
                        Normalize
                    </button>

                    {/* Keyboard Shortcuts Button */}
                    <button
                        onClick={() => setShowKeyboardHelp(true)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-lg transition-colors"
                        title="Keyboard Shortcuts (?)"
                    >
                        <Keyboard className="w-4 h-4" />
                    </button>

                    <div className="ml-auto text-sm text-gray-400">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>



                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="mt-3 text-gray-400">Loading waveform...</span>
                        <span className="mt-1 text-xs text-gray-500">Large audio files may take a moment</span>
                    </div>
                )}

                {/* Minimap (overview of entire file) */}
                <div className={`mb-2 ${isLoading ? 'hidden' : ''}`}>
                    <div className="text-xs text-gray-500 mb-1">Overview (click to navigate)</div>
                    <div id="minimap" className="bg-gray-800 rounded-lg p-2" />
                </div>

                {/* Waveform Container */}
                <div className={`bg-gray-800 rounded-lg p-4 relative ${isLoading ? 'hidden' : ''}`}>
                    {/* Selection info overlaid on waveform */}
                    {selection && (
                        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-gray-900/90 rounded text-xs text-blue-300">
                            {formatTime(selection.start)} → {formatTime(selection.end)} ({formatTime(selection.duration)})
                        </div>
                    )}
                    <div
                        ref={waveformRef}
                        className="mb-2 cursor-crosshair overflow-x-auto"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#4b5563 #1f2937',
                        }}
                    />
                    <div id="timeline" />
                </div>

                {/* Custom scrollbar styles */}
                <style jsx>{`
                    div :global(::-webkit-scrollbar) {
                        height: 10px;
                    }
                    div :global(::-webkit-scrollbar-track) {
                        background: #1f2937;
                        border-radius: 5px;
                    }
                    div :global(::-webkit-scrollbar-thumb) {
                        background: #4b5563;
                        border-radius: 5px;
                    }
                    div :global(::-webkit-scrollbar-thumb:hover) {
                        background: #6b7280;
                    }
                `}</style>

                {/* Enhanced Selection Instruction - only show when no selection */}
                {!isLoading && !selection && (
                    <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            <span><strong className="text-gray-300">Click and drag</strong> on the waveform to select audio for cropping, cutting, or fading</span>
                        </div>
                    </div>
                )}

                {/* Audio Meters - Show when audio is loaded */}
                {!isLoading && audioContext && sourceNode && meterView !== 'none' && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Volume2 className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                    {meterView === 'peak' ? 'Peak Levels' : 'VU Meters'}
                                </span>
                            </div>
                            <MeterToggle value={meterView} onChange={setMeterView} />
                        </div>

                        {/* Peak Meter */}
                        {meterView === 'peak' && (
                            <PeakMeter audioContext={audioContext} sourceNode={sourceNode} />
                        )}

                        {/* VU Meter */}
                        {meterView === 'vu' && (
                            <AnalogVUMeter audioContext={audioContext} sourceNode={sourceNode} />
                        )}
                    </div>
                )}

                {/* Selection Actions Toolbar - only show when selection exists */}
                {selection && (
                    <div className={`mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 ${isLoading ? 'hidden' : ''}`}>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs text-gray-400">Selection:</span>
                            <button
                                onClick={handleKeepSelection}
                                disabled={isSaving}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-emerald-600/50 text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex items-center gap-1.5"
                                title="Keeps only the selected portion, removes everything else"
                            >
                                {processingOperation === 'keep' ? <Loader className="w-3 h-3 animate-spin" /> : <Crop className="w-3 h-3" />}
                                Crop
                            </button>
                            <button
                                onClick={handleDeleteSelection}
                                disabled={isSaving}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-red-600/50 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex items-center gap-1.5"
                                title="Removes the selected portion, joins the rest together"
                            >
                                {processingOperation === 'delete' ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Cut
                            </button>
                            <button
                                onClick={clearSelection}
                                disabled={isSaving}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex items-center gap-1.5"
                                title="Cancel selection (Esc)"
                            >
                                <X className="w-3 h-3" />
                                Cancel
                            </button>
                            {/* Fade controls - user sets duration, applies to selection */}
                            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-700">
                                <span className="text-xs text-gray-400">Fade</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={fadeDuration}
                                    onChange={(e) => setFadeDuration(Math.max(1, Math.min(60, Number(e.target.value))))}
                                    className="w-12 px-1 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded text-white text-center"
                                    title="Fade duration in seconds"
                                />
                                <span className="text-xs text-gray-500">sec</span>
                                <button
                                    onClick={() => handleProcessAudio('fade', { fadeIn: fadeDuration, fadeOut: 0, startTime: selection.start, endTime: selection.start + fadeDuration })}
                                    disabled={isSaving}
                                    className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-blue-600/50 text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs transition-colors"
                                    title={`Apply ${fadeDuration}s fade in starting at selection`}
                                >
                                    {processingOperation === 'fade' ? <Loader className="w-3 h-3 animate-spin" /> : null}
                                    In
                                </button>
                                <button
                                    onClick={() => handleProcessAudio('fade', { fadeIn: 0, fadeOut: fadeDuration, startTime: selection.end - fadeDuration, endTime: selection.end })}
                                    disabled={isSaving}
                                    className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-blue-600/50 text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs transition-colors"
                                    title={`Apply ${fadeDuration}s fade out ending at selection`}
                                >
                                    Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Normalize Modal */}
            <NormalizeModal
                isOpen={showNormalizeModal}
                onClose={() => setShowNormalizeModal(false)}
                onNormalize={(params) => {
                    handleProcessAudio('normalize', params);
                }}
                hasSelection={!!selection}
            />

            {/* Keyboard Shortcuts Modal */}
            {showKeyboardHelp && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowKeyboardHelp(false)}>
                    <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full shadow-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Keyboard className="w-6 h-6" />
                            Keyboard Shortcuts
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-300">
                                <span>Play / Pause</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">Space</kbd>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Seek Backward 5s</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">←</kbd>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Seek Forward 5s</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">→</kbd>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Zoom In</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">+</kbd>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Zoom Out</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">-</kbd>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Toggle Loop</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">L</kbd>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Clear Selection</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">Esc</kbd>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>Toggle Help</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">?</kbd>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowKeyboardHelp(false)}
                            className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


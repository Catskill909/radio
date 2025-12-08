'use client';

import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';

// Scrolling text styles
const scrollingStyles = `
@keyframes marquee {
    0%, 20% { transform: translateX(0); }
    80%, 100% { transform: translateX(calc(-100% + 140px)); }
}
.marquee-container {
    overflow: hidden;
    max-width: 140px;
}
.marquee-text {
    display: inline-block;
    white-space: nowrap;
    animation: marquee 8s ease-in-out infinite;
    animation-delay: 1s;
}
.marquee-text:hover {
    animation-play-state: paused;
}
`;

interface NowPlayingData {
    stationInfo: {
        name: string;
        tagline: string;
        defaultArtwork: string;
    };
    currentShow: {
        id: string;
        title: string;
        host: string;
        artwork: string;
        startTime: string;
        endTime: string;
        timeRemaining?: number;
    } | null;
    nextShow: any | null;
}

interface MiniPlayerProps {
    streamUrl?: string | null;
}

export default function MiniPlayer({ streamUrl: initialStreamUrl }: MiniPlayerProps) {
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingStream, setIsLoadingStream] = useState(false);
    const [streamUrl, setStreamUrl] = useState<string | null>(initialStreamUrl || null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch Now Playing data
    useEffect(() => {
        const fetchNowPlaying = () => {
            fetch('/api/public/now-playing')
                .then(res => res.json())
                .then(data => setNowPlaying(data))
                .catch(err => console.error('Error fetching now playing:', err));
        };

        fetchNowPlaying();
        const interval = setInterval(fetchNowPlaying, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch Stream URL if not provided
    useEffect(() => {
        if (!initialStreamUrl) {
            import('@/app/actions').then(({ getStationSettings }) => {
                getStationSettings().then((settings: any) => {
                    if (settings.streamUrl) {
                        setStreamUrl(settings.streamUrl);
                    }
                }).catch(err => {
                    console.error('Failed to load stream settings:', err);
                });
            });
        }
    }, [initialStreamUrl]);

    // Audio Element Management
    useEffect(() => {
        if (audioRef.current) return;

        const audio = new Audio();
        audio.preload = 'none';

        const handleLoadStart = () => setIsLoadingStream(true);
        const handleCanPlay = () => setIsLoadingStream(false);
        const handleError = (e: Event) => {
            const audioElement = e.target as HTMLAudioElement;
            if (!audioElement.src || audioElement.src === '') return;
            setIsLoadingStream(false);
            setIsPlaying(false);
        };

        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        audioRef.current = audio;

        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('loadstart', handleLoadStart);
                audioRef.current.removeEventListener('canplay', handleCanPlay);
                audioRef.current.removeEventListener('error', handleError);
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, []);

    // Play/Pause Logic
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !streamUrl) return;

        if (isPlaying) {
            if (audio.src !== streamUrl) {
                audio.src = streamUrl;
            }
            setIsLoadingStream(true);
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsLoadingStream(false))
                    .catch(error => {
                        console.error("Audio playback failed:", error);
                        setIsPlaying(false);
                        setIsLoadingStream(false);
                    });
            }
        } else {
            audio.pause();
            audio.src = '';
            audio.load();
            setIsLoadingStream(false);
        }
    }, [isPlaying, streamUrl]);

    const handlePlayPause = () => {
        if (!streamUrl) {
            console.warn("No stream URL configured");
            return;
        }
        setIsPlaying(!isPlaying);
    };

    if (!nowPlaying) return null;

    const { currentShow, stationInfo } = nowPlaying;
    const artwork = currentShow?.artwork || stationInfo.defaultArtwork;
    const title = currentShow?.title || stationInfo.name;
    const subtitle = currentShow?.host ? `with ${currentShow.host}` : stationInfo.tagline;

    return (
        <div className="flex items-center gap-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl px-3 py-2 shadow-lg">
            {/* Inject scrolling styles */}
            <style dangerouslySetInnerHTML={{ __html: scrollingStyles }} />

            {/* Compact Artwork */}
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                <img
                    src={getImageUrl(artwork, 'icon') || ''}
                    alt={title}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Metadata - Compact with scrolling title */}
            <div className="flex flex-col justify-center min-w-[140px]">
                <div className="flex items-center gap-1.5">
                    <div className="marquee-container">
                        <h2 className="marquee-text text-white font-semibold text-sm leading-tight">{title}</h2>
                    </div>
                    {currentShow && (
                        <span className="bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded animate-pulse flex-shrink-0">
                            LIVE
                        </span>
                    )}
                </div>
                <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[140px]">{subtitle}</p>
            </div>

            {/* Time Remaining - Compact */}
            {currentShow?.timeRemaining && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600/30">
                    <span className="text-blue-400 font-mono font-bold text-sm">
                        {currentShow.timeRemaining}m
                    </span>
                </div>
            )}

            {/* Play/Pause Button - Compact */}
            <button
                onClick={handlePlayPause}
                disabled={isLoadingStream || !streamUrl}
                aria-label={isLoadingStream ? 'Loading stream' : isPlaying ? 'Pause' : 'Play'}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
                {isLoadingStream ? (
                    <Loader2 className="w-5 h-5 text-black animate-spin" />
                ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-black fill-current" />
                ) : (
                    <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                )}
            </button>
        </div>
    );
}

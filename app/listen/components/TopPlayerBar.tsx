'use client';

import { Play, Pause } from 'lucide-react';
import { NowPlayingData } from './types';

interface TopPlayerBarProps {
    nowPlaying: NowPlayingData | null;
    isPlaying: boolean;
    onPlayPause: () => void;
}

export default function TopPlayerBar({
    nowPlaying,
    isPlaying,
    onPlayPause
}: TopPlayerBarProps) {
    if (!nowPlaying) return null;

    const { currentShow, stationInfo } = nowPlaying;
    const artwork = currentShow?.artwork || stationInfo.defaultArtwork;
    const title = currentShow?.title || stationInfo.name;
    const subtitle = currentShow?.host ? `with ${currentShow.host}` : stationInfo.tagline;

    return (
        <div className="fixed top-0 left-0 right-0 h-[80px] bg-gray-900 border-b border-gray-800 z-40 flex items-center px-6 justify-between">
            {/* Left: Station & Show Info */}
            <div className="flex items-center gap-4">
                {/* Logo/Artwork */}
                <div className="relative w-12 h-12 rounded-md overflow-hidden shadow-sm">
                    <img
                        src={artwork}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Text Info */}
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <h2 className="text-white font-bold text-lg leading-tight">{title}</h2>
                        {currentShow && (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                                LIVE
                            </span>
                        )}
                    </div>
                    <p className="text-gray-400 text-sm">{subtitle}</p>
                </div>
            </div>

            {/* Right: Controls & Time */}
            <div className="flex items-center gap-6">
                {currentShow?.timeRemaining && (
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Time Remaining</p>
                        <p className="text-blue-400 font-mono font-bold">{currentShow.timeRemaining}m</p>
                    </div>
                )}

                <button
                    onClick={onPlayPause}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
                >
                    {isPlaying ? (
                        <Pause className="w-5 h-5 text-black fill-current" />
                    ) : (
                        <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                    )}
                </button>
            </div>
        </div>
    );
}

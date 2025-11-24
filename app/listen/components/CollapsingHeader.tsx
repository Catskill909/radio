'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Radio } from 'lucide-react';
import { NowPlayingData } from './types';

interface CollapsingHeaderProps {
    nowPlaying: NowPlayingData | null;
    isPlaying: boolean;
    onPlayPause: () => void;
}

export default function CollapsingHeader({
    nowPlaying,
    isPlaying,
    onPlayPause
}: CollapsingHeaderProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            // Collapse when scrolled down more than 50px
            setIsCollapsed(scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!nowPlaying) return null;

    const { currentShow, stationInfo } = nowPlaying;
    const artwork = currentShow?.artwork || stationInfo.defaultArtwork;
    const title = currentShow?.title || stationInfo.name;
    const subtitle = currentShow?.host ? `with ${currentShow.host}` : stationInfo.tagline;

    return (
        <>
            {/* Expanded Header (Scrolls away) */}
            <div
                className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${isCollapsed ? '-translate-y-full' : 'translate-y-0'
                    }`}
            >
                <div className="bg-gradient-to-b from-gray-900 to-black p-6 pb-12 pt-12">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative w-48 h-48 mb-6 shadow-2xl rounded-lg overflow-hidden">
                            <img
                                src={artwork}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                            {currentShow && (
                                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                    LIVE
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                        <p className="text-gray-400 mb-6">{subtitle}</p>

                        <button
                            onClick={onPlayPause}
                            className="bg-white text-black rounded-full p-4 hover:scale-105 transition-transform shadow-lg"
                        >
                            {isPlaying ? (
                                <Pause className="w-8 h-8 fill-current" />
                            ) : (
                                <Play className="w-8 h-8 fill-current ml-1" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsed Mini Player (Sticky) */}
            <div
                className={`fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 transition-transform duration-300 ease-in-out ${isCollapsed ? 'translate-y-0' : '-translate-y-full'
                    }`}
            >
                <div className="flex items-center justify-between p-3 max-w-screen-xl mx-auto">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img
                            src={artwork}
                            alt={title}
                            className="w-10 h-10 rounded object-cover bg-gray-800"
                        />
                        <div className="flex flex-col overflow-hidden">
                            <h3 className="text-sm font-bold text-white truncate">{title}</h3>
                            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
                        </div>
                    </div>

                    <button
                        onClick={onPlayPause}
                        className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform ml-3 shrink-0"
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                        ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Spacer to prevent content jumping */}
            <div className="h-[450px]" />
        </>
    );
}

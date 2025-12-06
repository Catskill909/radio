'use client';

import { Play, Pause } from 'lucide-react';
import { NowPlayingData } from './types';
import { getImageUrl } from '@/lib/image-utils';

interface MobileHeaderProps {
    nowPlaying: NowPlayingData | null;
    isPlaying: boolean;
    onPlayPause: () => void;
}

export default function MobileHeader({
    nowPlaying,
    isPlaying,
    onPlayPause
}: MobileHeaderProps) {
    if (!nowPlaying) return null;

    const { currentShow, stationInfo } = nowPlaying;
    const artwork = currentShow?.artwork || stationInfo.defaultArtwork;
    const title = currentShow?.title || stationInfo.name;
    const subtitle = currentShow?.host ? `with ${currentShow.host}` : stationInfo.tagline;

    // Check if station branding should be shown
    const showBranding = (stationInfo.showSiteLogo && stationInfo.siteLogo) ||
        (stationInfo.showSiteTitle && stationInfo.siteTitle) ||
        (stationInfo.showSiteTagline && stationInfo.siteTagline);

    return (
        <>
            {/* Compact Player - ALWAYS STICKY at the very top */}
            {/* pt-3 = 12px breathing room */}
            <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md pt-3 pb-3 px-3">
                <div className="flex items-center justify-between max-w-screen-xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <img
                                src={getImageUrl(artwork, 'icon') || ''}
                                alt={title}
                                className="w-10 h-10 rounded object-cover bg-gray-800"
                            />
                            {currentShow && (
                                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold px-1 py-0.5 rounded animate-pulse">
                                    LIVE
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <h3 className="text-sm font-bold text-white truncate">{title}</h3>
                            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
                        </div>
                    </div>

                    <button
                        onClick={onPlayPause}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                        className="bg-white text-black rounded-full p-2.5 hover:scale-105 active:scale-95 transition-transform ml-3 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                        ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Station Branding - BELOW player, scrolls away when user scrolls up */}
            {showBranding && (
                <div className="flex items-center justify-center gap-4 px-4 py-4 bg-gradient-to-b from-gray-900 to-black">
                    {stationInfo.showSiteLogo && stationInfo.siteLogo && (
                        <img
                            src={stationInfo.siteLogo}
                            alt="Site Logo"
                            className="h-12 w-auto object-contain rounded"
                        />
                    )}
                    <div className="flex flex-col">
                        {stationInfo.showSiteTitle && stationInfo.siteTitle && (
                            <h1
                                className="text-xl font-bold text-white leading-tight"
                                style={{ fontFamily: 'Oswald, sans-serif' }}
                            >
                                {stationInfo.siteTitle}
                            </h1>
                        )}
                        {stationInfo.showSiteTagline && stationInfo.siteTagline && (
                            <p className="text-xs text-gray-400">
                                {stationInfo.siteTagline}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

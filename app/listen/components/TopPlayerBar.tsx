import { Play, Pause, Clock, Loader2 } from 'lucide-react';
import { NowPlayingData } from './types';

interface TopPlayerBarProps {
    nowPlaying: NowPlayingData | null;
    isPlaying: boolean;
    isLoadingStream: boolean;
    onPlayPause: () => void;
}

export default function TopPlayerBar({
    nowPlaying,
    isPlaying,
    isLoadingStream,
    onPlayPause
}: TopPlayerBarProps) {
    if (!nowPlaying) return null;

    const { currentShow, stationInfo } = nowPlaying;
    const artwork = currentShow?.artwork || stationInfo.defaultArtwork;
    const title = currentShow?.title || stationInfo.name;
    const subtitle = currentShow?.host ? `with ${currentShow.host}` : stationInfo.tagline;

    return (
        <>
            <div className="fixed top-0 left-0 right-0 h-[100px] bg-black z-40 flex items-center justify-end px-6">
                {/* Unified Player Card - Right Aligned */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 shadow-lg">
                    {/* Logo/Artwork */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                        <img
                            src={artwork}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col justify-center min-w-[200px]">
                        <div className="flex items-center gap-2">
                            <h2 className="text-white font-bold text-base leading-tight">{title}</h2>
                            {currentShow && (
                                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                                    LIVE
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>
                    </div>

                    {/* Time Remaining */}
                    {currentShow?.timeRemaining && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium leading-none">
                                    Time Left
                                </span>
                                <span className="text-blue-400 font-mono font-bold text-lg leading-tight">
                                    {currentShow.timeRemaining}m
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Play/Pause Button */}
                    <button
                        onClick={onPlayPause}
                        disabled={isLoadingStream}
                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10 flex-shrink-0 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isLoadingStream ? (
                            <Loader2 className="w-6 h-6 text-black animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="w-6 h-6 text-black fill-current" />
                        ) : (
                            <Play className="w-6 h-6 text-black fill-current ml-0.5" />
                        )}
                    </button>
                </div>
            </div>
            {/* Full-width glass border separator */}
            <div className="fixed top-[100px] left-0 right-0 h-[1px] z-40 bg-gradient-to-r from-transparent via-gray-600/40 to-transparent backdrop-blur-sm shadow-sm" />
        </>
    );
}

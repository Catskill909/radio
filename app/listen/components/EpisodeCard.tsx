'use client';

import { format } from 'date-fns';
import { Play, Pause } from 'lucide-react';
import { Episode } from './types';

interface EpisodeCardProps {
    episode: Episode;
    isPlaying: boolean;
    onPlay: () => void;
    fullWidth?: boolean;
}

export default function EpisodeCard({ episode, isPlaying, onPlay, fullWidth = false }: EpisodeCardProps) {
    return (
        <div className={`flex-shrink-0 ${fullWidth ? 'w-full' : 'w-[280px]'} bg-gray-800 rounded-lg overflow-hidden snap-start group hover:bg-gray-750 transition-colors`}>
            <div className="flex items-center p-3 gap-3">
                {/* Thumbnail (Left) */}
                <div className="relative w-12 h-12 shrink-0 rounded bg-gray-700 overflow-hidden">
                    <img
                        src={episode.coverImage}
                        alt={episode.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Info (Middle) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-sm font-bold text-white truncate leading-tight mb-0.5">
                        {episode.title}
                    </h4>
                    <span className="text-xs text-gray-400 truncate">
                        {format(new Date(episode.publishedAt), 'MMM d, yyyy')}
                    </span>
                </div>

                {/* Play Button (Right) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPlay();
                    }}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform"
                >
                    {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                    ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                </button>
            </div>
        </div>
    );
}

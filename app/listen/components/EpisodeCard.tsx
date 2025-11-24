'use client';

import { format } from 'date-fns';
import { Play, Pause, Clock } from 'lucide-react';
import { Episode } from './types';
import { useState, useRef, useEffect } from 'react';

interface EpisodeCardProps {
    episode: Episode;
    isPlaying: boolean; // Acts as "isActive"
    onPlay: () => void;
    fullWidth?: boolean;
}

export default function EpisodeCard({ episode, isPlaying: isActive, onPlay, fullWidth = false }: EpisodeCardProps) {
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Extract filename for API URL
    const filename = episode.audioPath ? episode.audioPath.split(/[/\\]/).pop() : '';
    const audioUrl = filename ? `/api/audio/${filename}` : '';

    // Handle Active State Changes
    useEffect(() => {
        let mounted = true;

        if (isActive) {
            setIsPaused(false);
            // Small timeout to ensure DOM is ready and prevent immediate interruption
            const timer = setTimeout(() => {
                if (mounted && audioRef.current) {
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            if (error.name !== 'AbortError') {
                                console.log("Playback prevented:", error);
                            }
                        });
                    }
                }
            }, 50);
            return () => {
                mounted = false;
                clearTimeout(timer);
            };
        } else {
            setIsPaused(false);
        }
    }, [isActive]);

    const togglePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isActive) {
            onPlay();
        } else {
            if (audioRef.current) {
                if (audioRef.current.paused) {
                    audioRef.current.play().catch(console.error);
                    setIsPaused(false);
                } else {
                    audioRef.current.pause();
                    setIsPaused(true);
                }
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newProgress = parseFloat(e.target.value);
        if (audioRef.current) {
            const newTime = (newProgress / 100) * audioRef.current.duration;
            audioRef.current.currentTime = newTime;
            setProgress(newProgress);
            setCurrentTime(newTime);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`flex-shrink-0 ${fullWidth ? 'w-full' : 'w-[280px]'} bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group`}>
            <div className={`flex ${fullWidth ? 'flex-row h-32' : 'flex-col'}`}>
                {/* Thumbnail (Clean) */}
                <div className={`relative ${fullWidth ? 'w-32 h-32' : 'w-full aspect-square'} bg-gray-800 shrink-0`}>
                    <img
                        src={episode.coverImage || '/default-show.png'}
                        alt={episode.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col min-w-0 relative">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1" title={episode.title}>
                            {episode.title}
                        </h4>
                        <p className="text-xs text-gray-400 mb-2">
                            {format(new Date(episode.publishedAt), 'MMMM d, yyyy')}
                        </p>
                    </div>

                    {isActive ? (
                        /* Active Player Controls */
                        <div className="w-full mt-auto animate-fade-in">
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={() => setIsPaused(true)}
                            // Remove autoPlay prop as we handle it in useEffect
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={togglePlayPause}
                                    className="shrink-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                                >
                                    {isPaused ? (
                                        <Play className="w-3 h-3 fill-current ml-0.5" />
                                    ) : (
                                        <Pause className="w-3 h-3 fill-current" />
                                    )}
                                </button>

                                <span className="text-[10px] text-gray-400 w-8 text-right font-mono shrink-0">
                                    {formatTime(currentTime)}
                                </span>

                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={progress || 0}
                                    onChange={handleSeek}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                                />

                                <span className="text-[10px] text-gray-400 w-8 font-mono shrink-0">
                                    {formatTime(duration || episode.duration)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* Metadata (Inactive) - Play Button Bottom Right */
                        <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{Math.floor(episode.duration / 60)}m</span>
                            </div>

                            <button
                                onClick={togglePlayPause}
                                className="shrink-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                            >
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

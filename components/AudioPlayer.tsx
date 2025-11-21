"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface AudioPlayerProps {
    src: string;
    title?: string;
}

export function AudioPlayer({ src, title }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-3 bg-gray-900/50 rounded-full p-2 pr-4 border border-gray-700">
            <button
                onClick={togglePlay}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors text-white flex-shrink-0"
            >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="flex flex-col gap-1 min-w-[120px]">
                {title && <div className="text-xs text-gray-400 truncate max-w-[150px]">{title}</div>}
                <div className="flex items-center gap-2">
                    <div className="h-1 bg-gray-700 rounded-full w-24 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
        </div>
    );
}

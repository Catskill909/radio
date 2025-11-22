'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
    src: string
    title?: string
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [isHoveringVolume, setIsHoveringVolume] = useState(false)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const setAudioData = () => {
            setDuration(audio.duration)
        }

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime)
        }

        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
            audio.currentTime = 0
        }

        // Add event listeners
        audio.addEventListener('loadedmetadata', setAudioData)
        audio.addEventListener('timeupdate', setAudioTime)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData)
            audio.removeEventListener('timeupdate', setAudioTime)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value)
        if (audioRef.current) {
            audioRef.current.currentTime = time
            setCurrentTime(time)
        }
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value)
        if (audioRef.current) {
            audioRef.current.volume = vol
            setVolume(vol)
            setIsMuted(vol === 0)
        }
    }

    const toggleMute = () => {
        if (audioRef.current) {
            const newMutedState = !isMuted
            setIsMuted(newMutedState)
            audioRef.current.muted = newMutedState
            if (!newMutedState && volume === 0) {
                setVolume(0.5)
                audioRef.current.volume = 0.5
            }
        }
    }

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-full p-2 pr-6 flex items-center gap-4 w-full transition-all hover:border-gray-600 hover:bg-gray-900/80 group">
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/30"
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
            </button>

            {/* Progress Bar & Time */}
            <div className="flex-1 flex flex-col justify-center gap-1 min-w-[200px]">
                {title && (
                    <div className="text-xs font-medium text-gray-400 truncate">
                        {title}
                    </div>
                )}
                <div className="flex items-center gap-3 w-full">
                    <span className="text-xs font-mono text-gray-400 w-9 text-right flex-shrink-0">
                        {formatTime(currentTime)}
                    </span>

                    <div className="relative flex-1 h-1.5 group/slider">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="absolute inset-0 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-100 ease-out"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            />
                        </div>
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none"
                            style={{ left: `${(currentTime / (duration || 1)) * 100}%`, transform: `translate(-50%, -50%)` }}
                        />
                    </div>

                    <span className="text-xs font-mono text-gray-500 w-9 flex-shrink-0">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* Volume Control */}
            <div
                className="relative flex items-center"
                onMouseEnter={() => setIsHoveringVolume(true)}
                onMouseLeave={() => setIsHoveringVolume(false)}
            >
                <div className={cn(
                    "absolute right-full mr-2 bg-gray-800 rounded-lg p-2 transition-all duration-200 origin-right flex items-center shadow-xl border border-gray-700",
                    isHoveringVolume ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-2 pointer-events-none"
                )}>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                </div>
                <button
                    onClick={toggleMute}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                >
                    {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                    ) : (
                        <Volume2 className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    )
}

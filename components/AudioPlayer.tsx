/**
 * ⚠️ WARNING: READ BEFORE MODIFYING ⚠️
 * 
 * This component took 3+ hours to fix. Before making ANY changes:
 * 1. Read: /AUDIO-PLAYER-FINAL-SOLUTION.md
 * 2. DO NOT touch scrubber code
 * 3. DO NOT remove preload or onLoadedMetaData
 * 4. ONLY modify CSS for styling changes
 * 
 * If you break this, you'll spend hours fixing it again!
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import AudioPlayerLib from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'
import './AudioPlayer.css'

interface AudioPlayerProps {
    src: string
    title?: string
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
    const [playerKey, setPlayerKey] = useState(src)
    const playerRef = useRef<AudioPlayerLib>(null)
    const hasLoadedRef = useRef(false)

    const handleLoadedMetaData = () => {
        // Standard event handling
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true
            setPlayerKey(`${src}_loaded_${Date.now()}`)
        }
    }

    useEffect(() => {
        const interval = setInterval(() => {
            const audio = playerRef.current?.audio.current
            if (audio && audio.readyState >= 1 && !hasLoadedRef.current) {
                // Metadata loaded but event missed/ignored? Force remount!
                hasLoadedRef.current = true
                setPlayerKey(`${src}_loaded_${Date.now()}`)
                clearInterval(interval)
            }
        }, 500)

        return () => clearInterval(interval)
    }, [src])

    return (
        <div className="w-full audio-player-wrapper">
            <AudioPlayerLib
                ref={playerRef}
                key={playerKey}
                src={src}
                autoPlay={false}
                showJumpControls={false}
                layout="horizontal-reverse"
                customAdditionalControls={[]}
                customVolumeControls={[]}
                preload="auto"
                onLoadedMetaData={handleLoadedMetaData}
            />
        </div>
    )
}

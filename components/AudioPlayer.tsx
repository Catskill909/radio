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

import { useState } from 'react'
import AudioPlayerLib from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'
import './AudioPlayer.css'

interface AudioPlayerProps {
    src: string
    title?: string
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
    return (
        <div className="w-full audio-player-wrapper">
            <AudioPlayerLib
                key={src}
                src={src}
                autoPlay={false}
                showJumpControls={false}
                layout="horizontal-reverse"
                customAdditionalControls={[]}
                customVolumeControls={[]}
                preload="auto"
            />
        </div>
    )
}

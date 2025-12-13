'use client'

import { useEffect, useRef } from 'react'

interface PeakMeterProps {
    audioElement?: HTMLAudioElement | null
    audioContext?: AudioContext | null
    sourceNode?: AudioNode | null
}

export default function PeakMeter({ audioElement, audioContext, sourceNode }: PeakMeterProps) {
    const meterContainerRef = useRef<HTMLDivElement>(null)
    const meterInstanceRef = useRef<any>(null)

    useEffect(() => {
        const initializeMeter = async () => {
            if (!meterContainerRef.current) return
            if (!audioContext || !sourceNode) return

            try {
                // Import the library - it exports { WebAudioPeakMeter }
                const { WebAudioPeakMeter } = await import('web-audio-peak-meter')

                // Create meter using constructor: new WebAudioPeakMeter(sourceNode, element, options)
                meterInstanceRef.current = new WebAudioPeakMeter(
                    sourceNode,
                    meterContainerRef.current,
                    {
                        backgroundColor: '#1e293b', // slate-800
                        tickColor: '#64748b', // slate-500
                        labelColor: '#94a3b8', // slate-400
                        fontSize: 10,
                        dbRangeMin: -48,
                        dbRangeMax: 0,
                        dbTickSize: 6,
                        maskTransition: '0.1s',
                        gradient: [
                            '#dc2626 1%',    // red-600 (clip zone)
                            '#ef4444 15%',   // red-500 (danger)
                            '#f59e0b 30%',   // amber-500 (caution)
                            '#10b981 55%',   // green-500 (safe)
                            '#10b981 100%'   // green-500 (safe)
                        ],
                    }
                )

                console.log('Peak meter created successfully')
            } catch (error) {
                console.error('Failed to initialize peak meter:', error)
            }
        }

        initializeMeter()

        return () => {
            // Cleanup if needed
            if (meterInstanceRef.current) {
                meterInstanceRef.current = null
            }
        }
    }, [audioContext, sourceNode])

    return (
        <div className="peak-meter-wrapper">
            <div
                ref={meterContainerRef}
                className="peak-meter-container"
                style={{
                    width: '100%',
                    height: '80px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                }}
            />
            <style jsx>{`
                .peak-meter-container :global(canvas) {
                    width: 100% !important;
                    height: 100% !important;
                }
            `}</style>
        </div>
    )
}

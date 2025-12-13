'use client'

import { VUMeter } from 'vu-meter-react'

interface AnalogVUMeterProps {
    audioContext?: AudioContext | null
    sourceNode?: AudioNode | null
}

export default function AnalogVUMeter({ audioContext, sourceNode }: AnalogVUMeterProps) {
    if (!audioContext || !sourceNode) {
        return null
    }

    return (
        <div className="analog-vu-meter-wrapper flex justify-center">
            <VUMeter
                audioContext={audioContext}
                sourceNode={sourceNode}
                mono={false}
                options={{
                    theme: 'dark',
                    width: 300,
                    height: 180,
                    needleColor: '#10b981',
                    backgroundColor: '#1e293b',
                    labelColor: '#94a3b8',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            />
        </div>
    )
}

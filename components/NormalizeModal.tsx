'use client'

import { X, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface NormalizationPreset {
    id: string
    name: string
    description: string
    useCase: string
    lufs: number
    truePeak: number
    lra: number
}

const NORMALIZATION_PRESETS: NormalizationPreset[] = [
    {
        id: 'music-streaming',
        name: 'Music Streaming',
        description: '-14 LUFS',
        useCase: 'Spotify, Apple Music, Tidal standard.',
        lufs: -14,
        truePeak: -1.5,
        lra: 11,
    },
    {
        id: 'youtube',
        name: 'YouTube',
        description: '-14 LUFS (Integrated)',
        useCase: 'If your content is louder, YouTube will turn it down; if quieter, it typically leaves it as is.',
        lufs: -14,
        truePeak: -1.5,
        lra: 11,
    },
    {
        id: 'broadcast-tv',
        name: 'Broadcast TV (US)',
        description: '-24 LKFS/LUFS',
        useCase: 'ATSC A/85 standard for program content.',
        lufs: -24,
        truePeak: -1.5,
        lra: 11,
    },
    {
        id: 'eu-broadcast',
        name: 'EU Broadcast',
        description: '-23 LUFS with -1 dBTP',
        useCase: 'EBU R128 strict delivery standard.',
        lufs: -23,
        truePeak: -1.0,
        lra: 11,
    },
    {
        id: 'podcast',
        name: 'Podcast & Online Video',
        description: '-16 LUFS',
        useCase: 'Good balance between impact and dynamic range for spoken word.',
        lufs: -16,
        truePeak: -1.5,
        lra: 11,
    },
]

interface NormalizeModalProps {
    isOpen: boolean
    onClose: () => void
    onNormalize: (params: { targetLUFS: number; truePeak: number; lra: number }) => void
    hasSelection: boolean
}

export default function NormalizeModal({
    isOpen,
    onClose,
    onNormalize,
    hasSelection,
}: NormalizeModalProps) {
    const [selectedPreset, setSelectedPreset] = useState<string>('podcast')
    const [customLUFS, setCustomLUFS] = useState(-16)
    const [customTruePeak, setCustomTruePeak] = useState(-1.5)
    const [customLRA, setCustomLRA] = useState(11)
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedPreset('podcast')
            setCustomLUFS(-16)
            setCustomTruePeak(-1.5)
            setCustomLRA(11)
            setShowAdvanced(false)
        }
    }, [isOpen])

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const handleNormalize = () => {
        if (selectedPreset === 'custom') {
            onNormalize({
                targetLUFS: customLUFS,
                truePeak: customTruePeak,
                lra: customLRA,
            })
        } else {
            const preset = NORMALIZATION_PRESETS.find(p => p.id === selectedPreset)
            if (preset) {
                onNormalize({
                    targetLUFS: preset.lufs,
                    truePeak: preset.truePeak,
                    lra: preset.lra,
                })
            }
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg">
                            <Volume2 className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Normalize Audio</h2>
                            <p className="text-sm text-gray-400 mt-0.5">
                                {hasSelection ? 'Normalizing selection' : 'Normalizing entire file'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6 thin-scrollbar">
                    <div className="space-y-3">
                        {/* Presets */}
                        {NORMALIZATION_PRESETS.map(preset => (
                            <label
                                key={preset.id}
                                className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPreset === preset.id
                                        ? 'border-gray-500 bg-gray-800/70'
                                        : 'border-gray-800 bg-gray-800/30 hover:bg-gray-800/50 hover:border-gray-700'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name="preset"
                                        value={preset.id}
                                        checked={selectedPreset === preset.id}
                                        onChange={() => setSelectedPreset(preset.id)}
                                        className="mt-1 w-4 h-4 text-gray-500 bg-gray-700 border-gray-600 focus:ring-gray-500 focus:ring-offset-gray-900"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold text-white">{preset.name}</span>
                                            <span className="text-sm text-gray-400">{preset.description}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{preset.useCase}</p>
                                    </div>
                                </div>
                            </label>
                        ))}

                        {/* Custom Option */}
                        <label
                            className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPreset === 'custom'
                                    ? 'border-gray-500 bg-gray-800/70'
                                    : 'border-gray-800 bg-gray-800/30 hover:bg-gray-800/50 hover:border-gray-700'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    name="preset"
                                    value="custom"
                                    checked={selectedPreset === 'custom'}
                                    onChange={() => {
                                        setSelectedPreset('custom')
                                        setShowAdvanced(true)
                                    }}
                                    className="mt-1 w-4 h-4 text-gray-500 bg-gray-700 border-gray-600 focus:ring-gray-500 focus:ring-offset-gray-900"
                                />
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold text-white">Custom</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Specify your own target LUFS, True Peak, and LRA values.
                                    </p>

                                    {/* Custom Controls */}
                                    {selectedPreset === 'custom' && (
                                        <div className="mt-4 space-y-3 pl-1">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                    Target LUFS
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="range"
                                                        min="-30"
                                                        max="-5"
                                                        step="0.5"
                                                        value={customLUFS}
                                                        onChange={e => setCustomLUFS(Number(e.target.value))}
                                                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-500"
                                                    />
                                                    <span className="text-white font-mono text-sm w-16 text-right">
                                                        {customLUFS} LUFS
                                                    </span>
                                                </div>
                                            </div>

                                            {showAdvanced && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                            True Peak (dBTP)
                                                        </label>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="range"
                                                                min="-2"
                                                                max="0"
                                                                step="0.1"
                                                                value={customTruePeak}
                                                                onChange={e => setCustomTruePeak(Number(e.target.value))}
                                                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-500"
                                                            />
                                                            <span className="text-white font-mono text-sm w-16 text-right">
                                                                {customTruePeak} dBTP
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                            LRA (Loudness Range)
                                                        </label>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="20"
                                                                step="1"
                                                                value={customLRA}
                                                                onChange={e => setCustomLRA(Number(e.target.value))}
                                                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-500"
                                                            />
                                                            <span className="text-white font-mono text-sm w-16 text-right">
                                                                {customLRA}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {!showAdvanced && (
                                                <button
                                                    onClick={() => setShowAdvanced(true)}
                                                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                                                >
                                                    Show advanced settings →
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Info Footer */}
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            <strong className="text-gray-300">When to use:</strong> Mandatory for any content destined for streaming platforms, broadcast, or podcasts. Ensures your audio plays back at a consistent perceived loudness compared to other content.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-800 flex gap-3 justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleNormalize}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                    >
                        Normalize
                    </button>
                </div>
            </div>
        </div>
    )
}

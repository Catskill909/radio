'use client'

import { useState } from 'react'
import { updateStationSettings } from '@/app/actions'
import { Check } from 'lucide-react'

interface AudioEncodingSettingsProps {
    initialSettings: {
        audioCodec: string
        audioBitrate: number
        audioSampleRate: number | null
        audioVBR: boolean
    }
}

export default function AudioEncodingSettings({ initialSettings }: AudioEncodingSettingsProps) {
    const [codec, setCodec] = useState(initialSettings.audioCodec)
    const [bitrate, setBitrate] = useState(initialSettings.audioBitrate)
    const [sampleRate, setSampleRate] = useState(initialSettings.audioSampleRate?.toString() || 'auto')
    const [useVBR, setUseVBR] = useState(initialSettings.audioVBR)
    const [saved, setSaved] = useState(false)

    // Track if there are unsaved changes
    const hasChanges =
        codec !== initialSettings.audioCodec ||
        bitrate !== initialSettings.audioBitrate ||
        sampleRate !== (initialSettings.audioSampleRate?.toString() || 'auto') ||
        useVBR !== initialSettings.audioVBR

    // Calculate estimated file size for 1 hour
    const estimateFileSize = () => {
        if (codec === 'flac') {
            return '~400 MB' // Lossless, variable
        }
        // For lossy codecs, calculate based on bitrate
        const mbPerHour = (bitrate * 60 * 60) / (8 * 1024)
        return `~${Math.round(mbPerHour)} MB`
    }

    const handleSave = async () => {
        const formData = new FormData()
        formData.set('audioCodec', codec)
        formData.set('audioBitrate', bitrate.toString())
        formData.set('audioSampleRate', sampleRate === 'auto' ? '' : sampleRate)
        formData.set('audioVBR', useVBR.toString())

        await updateStationSettings(formData)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    const applyPreset = (preset: 'voice' | 'music' | 'archival') => {
        switch (preset) {
            case 'voice':
                setCodec('libmp3lame')
                setBitrate(96)
                setSampleRate('22050')
                setUseVBR(true)
                break
            case 'music':
                setCodec('libmp3lame')
                setBitrate(192)
                setSampleRate('auto')
                setUseVBR(true)
                break
            case 'archival':
                setCodec('flac')
                setBitrate(320)
                setSampleRate('48000')
                setUseVBR(false)
                break
        }
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold mb-1">Audio Recording Quality</h2>
                    <p className="text-sm text-gray-400">Configure encoding settings for recorded shows</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${saved
                            ? 'bg-green-600 text-white'
                            : hasChanges
                                ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                >
                    {saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved
                        </>
                    ) : hasChanges ? (
                        'Save Changes *'
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>

            {/* Quality Presets */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Quick Presets</label>
                <div className="flex gap-2">
                    <button
                        onClick={() => applyPreset('voice')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                        Voice (96kbps)
                    </button>
                    <button
                        onClick={() => applyPreset('music')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                        Music (192kbps)
                    </button>
                    <button
                        onClick={() => applyPreset('archival')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                        Archival (Lossless)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Audio Codec */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Audio Format
                    </label>
                    <select
                        value={codec}
                        onChange={(e) => setCodec(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="libmp3lame">MP3 (Universal Compatibility)</option>
                        <option value="aac">AAC (Better Quality/Size)</option>
                        <option value="libopus">Opus (Modern, Best Compression)</option>
                        <option value="flac">FLAC (Lossless, Large Files)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        {codec === 'libmp3lame' && 'Most compatible, works everywhere'}
                        {codec === 'aac' && 'Better quality than MP3 at same bitrate'}
                        {codec === 'libopus' && 'Excellent quality, smaller files'}
                        {codec === 'flac' && 'Perfect quality, no compression loss'}
                    </p>
                </div>

                {/* Sample Rate */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sample Rate
                    </label>
                    <select
                        value={sampleRate}
                        onChange={(e) => setSampleRate(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="auto">Auto (from source stream)</option>
                        <option value="22050">22.05 kHz (Voice/Podcasts)</option>
                        <option value="44100">44.1 kHz (CD Quality)</option>
                        <option value="48000">48 kHz (Professional)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        {sampleRate === 'auto' && 'Uses stream\'s original sample rate'}
                        {sampleRate === '22050' && 'Sufficient for voice content'}
                        {sampleRate === '44100' && 'Standard music quality'}
                        {sampleRate === '48000' && 'Professional audio quality'}
                    </p>
                </div>

                {/* Bitrate Slider - Only show for lossy codecs */}
                {codec !== 'flac' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bitrate: {bitrate} kbps
                        </label>
                        <input
                            type="range"
                            min="64"
                            max="320"
                            step="32"
                            value={bitrate}
                            onChange={(e) => setBitrate(parseInt(e.target.value))}
                            className="w-full accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>64 (Low)</span>
                            <span>128 (Standard)</span>
                            <span>192 (High)</span>
                            <span>320 (Max)</span>
                        </div>
                    </div>
                )}

                {/* VBR Toggle - Only show for lossy codecs */}
                {codec !== 'flac' && (
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useVBR}
                                onChange={(e) => setUseVBR(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-sm font-medium text-gray-300">Use Variable Bitrate (VBR)</span>
                                <p className="text-xs text-gray-500">Better quality/size ratio (recommended)</p>
                            </div>
                        </label>
                    </div>
                )}
            </div>

            {/* File Size Estimate */}
            <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-300">Estimated File Size (1 hour)</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {codec === 'flac' ? 'Lossless format, variable size' : `${bitrate} kbps ${useVBR ? 'VBR' : 'CBR'}`}
                        </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{estimateFileSize()}</p>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                <p className="text-xs text-blue-300">
                    <strong>Note:</strong> Recording quality settings will apply to all future recordings. Existing recordings will not be affected.
                </p>
            </div>
        </div>
    )
}

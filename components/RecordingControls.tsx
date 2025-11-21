'use client'

import { useState } from 'react'
import { Radio } from 'lucide-react'

interface RecordingControlsProps {
    recordingEnabled: boolean
    onRecordingEnabledChange: (enabled: boolean) => void
    recordingSource: string
    onRecordingSourceChange: (source: string) => void
}

const PLACEHOLDER_SOURCES = [
    { value: '', label: 'Select a source...' },
    { value: 'stream-1', label: 'Stream Source 1' },
    { value: 'stream-2', label: 'Stream Source 2' },
    { value: 'stream-3', label: 'Stream Source 3' },
    { value: 'custom', label: 'Custom URL (Coming Soon)' },
]

export default function RecordingControls({
    recordingEnabled,
    onRecordingEnabledChange,
    recordingSource,
    onRecordingSourceChange,
}: RecordingControlsProps) {
    return (
        <div className="space-y-4 p-6 bg-gray-900 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-200">Recording Settings</h3>
            </div>

            {/* Recording Toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="text-sm font-medium text-gray-300">
                        Enable Recording
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        Automatically record this show when scheduled
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onRecordingEnabledChange(!recordingEnabled)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${recordingEnabled ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${recordingEnabled ? 'translate-x-7' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            {/* Recording Source Dropdown */}
            {recordingEnabled && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label htmlFor="recordingSource" className="block text-sm font-medium text-gray-300">
                        Recording Source
                    </label>
                    <select
                        id="recordingSource"
                        value={recordingSource}
                        onChange={(e) => onRecordingSourceChange(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-200"
                    >
                        {PLACEHOLDER_SOURCES.map((source) => (
                            <option key={source.value} value={source.value}>
                                {source.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">
                        Stream sources will be configured in settings
                    </p>
                </div>
            )}

            {/* Hidden inputs for form submission */}
            <input type="hidden" name="recordingEnabled" value={recordingEnabled ? 'true' : 'false'} />
            <input type="hidden" name="recordingSource" value={recordingSource} />
        </div>
    )
}

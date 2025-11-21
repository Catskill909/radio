'use client'

import { useState } from 'react'
import { X, Radio, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createStream, testStreamUrl, updateStream } from '@/app/actions'

interface AddStreamModalProps {
    isOpen: boolean
    onClose: () => void
    editStream?: {
        id: string
        name: string
        url: string
    } | null
}

export default function AddStreamModal({ isOpen, onClose, editStream }: AddStreamModalProps) {
    const [name, setName] = useState(editStream?.name || '')
    const [url, setUrl] = useState(editStream?.url || '')
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)

    if (!isOpen) return null

    const handleTest = async () => {
        if (!url) return

        setIsTesting(true)
        setTestResult(null)

        try {
            const result = await testStreamUrl(url)
            setTestResult(result)
        } catch (error) {
            setTestResult({
                isValid: false,
                status: 'error',
                errorMessage: 'Failed to test stream',
            })
        } finally {
            setIsTesting(false)
        }
    }

    const handleSave = async () => {
        if (!name || !url) return

        setIsSaving(true)

        try {
            if (editStream) {
                await updateStream(editStream.id, name, url)
            } else {
                await createStream(name, url)
            }
            onClose()
            window.location.reload()
        } catch (error) {
            console.error('Failed to save stream:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleClose = () => {
        setName('')
        setUrl('')
        setTestResult(null)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl">
                {/* Header */}
                <div className="border-b border-gray-800 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Radio className="w-6 h-6 text-blue-500" />
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>
                            {editStream ? 'Edit Stream' : 'Add Icecast Stream'}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Stream Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Stream Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Main Station Stream"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Stream URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Stream URL *
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="http://stream.example.com:8000/stream"
                                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleTest}
                                disabled={!url || isTesting}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    'Test Stream'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Test Results */}
                    {testResult && (
                        <div className={`rounded-lg p-4 border ${testResult.isValid
                                ? 'bg-green-900/20 border-green-800'
                                : 'bg-red-900/20 border-red-800'
                            }`}>
                            <div className="flex items-start gap-3">
                                {testResult.isValid ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-semibold mb-2 ${testResult.isValid ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {testResult.isValid ? 'Stream is online!' : 'Stream test failed'}
                                    </p>

                                    {testResult.isValid && (
                                        <div className="space-y-1 text-sm text-gray-300">
                                            {testResult.format && (
                                                <p>Format: <span className="font-semibold">{testResult.format}</span></p>
                                            )}
                                            {testResult.bitrate && (
                                                <p>Bitrate: <span className="font-semibold">{testResult.bitrate} kbps</span></p>
                                            )}
                                            {testResult.listeners !== null && testResult.listeners !== undefined && (
                                                <p>Listeners: <span className="font-semibold">
                                                    {testResult.listeners}
                                                    {testResult.maxListeners ? ` / ${testResult.maxListeners}` : ''}
                                                </span></p>
                                            )}
                                            {testResult.genre && (
                                                <p>Genre: <span className="font-semibold">{testResult.genre}</span></p>
                                            )}
                                            {testResult.description && (
                                                <p>Description: <span className="font-semibold">{testResult.description}</span></p>
                                            )}
                                            {testResult.responseTime && (
                                                <p className="text-gray-400">Response time: {testResult.responseTime}ms</p>
                                            )}
                                        </div>
                                    )}

                                    {!testResult.isValid && testResult.errorMessage && (
                                        <p className="text-sm text-red-400">{testResult.errorMessage}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Note */}
                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-300">
                            <strong>Tip:</strong> Test your stream before adding to ensure it's working correctly.
                            The app will automatically extract metadata like bitrate, format, and listener count.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-800 p-6 flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name || !url || isSaving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            editStream ? 'Update Stream' : 'Add Stream'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

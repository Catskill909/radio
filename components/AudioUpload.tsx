'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileAudio, AlertCircle, Loader, X } from 'lucide-react'

interface AudioUploadProps {
    currentFile?: string
    currentDuration?: number | null
    onUpload: (filename: string, duration: number, size: number) => void
    onRemove?: () => void
}

export default function AudioUpload({ currentFile, currentDuration, onUpload, onRemove }: AudioUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showReplace, setShowReplace] = useState(false)

    const formatDuration = (seconds: number | null | undefined) => {
        if (!seconds) return 'Unknown';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError(null)
        const file = acceptedFiles[0]
        if (!file) return

        console.log("Audio file dropped:", file.name, file.type, file.size)

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/upload-audio', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Upload failed')
            }

            console.log("Audio upload success:", data)
            onUpload(data.filename, data.duration, data.size)
            setShowReplace(false)
        } catch (error) {
            console.error('Error uploading audio:', error)
            setError(error instanceof Error ? error.message : 'Failed to upload audio. Please try again.')
        } finally {
            setUploading(false)
        }
    }, [onUpload])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
        },
        maxFiles: 1,
        disabled: uploading
    })

    // Show current file info
    if (currentFile && !showReplace) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <FileAudio className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white break-all">{currentFile}</p>
                            {currentDuration !== null && currentDuration !== undefined && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Duration: {formatDuration(currentDuration)}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowReplace(true)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                        type="button"
                    >
                        Replace Audio
                    </button>
                </div>
            </div>
        )
    }

    // Show upload interface
    return (
        <div className="space-y-2">
            {currentFile && (
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Replacing: {currentFile}</p>
                    <button
                        onClick={() => setShowReplace(false)}
                        className="text-gray-400 hover:text-white"
                        type="button"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'}
                    ${error ? 'border-red-500 bg-red-500/10' : ''}
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-gray-400">
                    {uploading ? (
                        <>
                            <Loader className="w-8 h-8 mb-2 animate-spin text-blue-400" />
                            <p className="text-blue-400">Uploading and processing...</p>
                        </>
                    ) : error ? (
                        <>
                            <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
                            <p className="font-medium text-red-400">Upload Failed</p>
                        </>
                    ) : isDragActive ? (
                        <>
                            <Upload className="w-8 h-8 mb-2 text-blue-400" />
                            <p className="text-blue-400">Drop the audio file here</p>
                        </>
                    ) : (
                        <>
                            <FileAudio className="w-8 h-8 mb-2" />
                            <p className="font-medium text-gray-300">Drag & drop audio file here</p>
                            <p className="text-xs text-gray-500">
                                Supports: MP3, WAV, M4A, OGG (Max 500MB)
                            </p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-400 text-center px-2">
                    {error}
                </p>
            )}
        </div>
    )
}

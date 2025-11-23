'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError(null)
        const file = acceptedFiles[0]
        if (!file) return

        console.log("File dropped:", file.name, file.type, file.size)

        // Validate image dimensions
        const img = new window.Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = async () => {
            URL.revokeObjectURL(objectUrl)
            const { width, height } = img
            console.log("Image dimensions:", width, "x", height)

            // 1. Check if square
            if (width !== height) {
                const msg = `Image must be square (1:1 aspect ratio). Current: ${width}x${height}`
                console.warn(msg)
                setError(msg)
                return
            }

            // 2. Check dimensions (1400x1400 - 3000x3000)
            // User mentioned 3000 in prompt, code had 2800. Relaxing to 3000 to be safe.
            if (width < 1400 || width > 3000) {
                const msg = `Image dimensions must be between 1400x1400 and 3000x3000 pixels. Current: ${width}x${height}`
                console.warn(msg)
                setError(msg)
                return
            }

            // Proceed with upload if valid
            setUploading(true)
            const formData = new FormData()
            formData.append('file', file)

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error('Upload failed')
                }

                const data = await response.json()
                console.log("Upload success:", data.url)
                onChange(data.url)
            } catch (error) {
                console.error('Error uploading file:', error)
                setError('Failed to upload image. Please try again.')
            } finally {
                setUploading(false)
            }
        }

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            console.error("Failed to load image for validation")
            setError("Failed to load image. Is it a valid image file?")
        }

        img.src = objectUrl
    }, [onChange])

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        noClick: !!value // Disable click on the container if value exists (we'll use a specific button)
    })

    if (value) {
        return (
            <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-700 group">
                <Image
                    src={value}
                    alt="Show cover"
                    fill
                    className="object-cover"
                />

                {/* Overlay for replacing image */}
                <div
                    {...getRootProps()}
                    className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 cursor-pointer ${isDragActive ? 'opacity-100 bg-blue-500/20' : ''}`}
                    onClick={open}
                >
                    <input {...getInputProps()} />
                    <Upload className="w-8 h-8 text-gray-200" />
                    <span className="text-sm font-medium text-gray-200">Click or Drop to Replace</span>
                </div>

                {/* Remove button - Toned down colors */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange('');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-900/80 text-gray-200 hover:text-white rounded-full backdrop-blur-sm transition-all z-10"
                    type="button"
                    title="Remove image"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500/50 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'}
            ${error ? 'border-red-900/50 bg-red-900/10' : ''}
          `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Upload className={`w-8 h-8 mb-2 ${error ? 'text-red-400' : 'text-gray-500'}`} />
                    {uploading ? (
                        <p className="text-gray-300">Uploading...</p>
                    ) : isDragActive ? (
                        <p className="text-blue-400">Drop to replace</p>
                    ) : (
                        <>
                            <p className="font-medium text-gray-300">Drag & drop or click to upload</p>
                            <p className="text-xs text-gray-500">
                                Square image, 1400x1400 to 3000x3000px
                            </p>
                        </>
                    )}
                </div>
            </div>
            {error && (
                <p className="text-xs text-red-400 text-center px-2 bg-red-900/10 py-1 rounded border border-red-900/20">
                    {error}
                </p>
            )}
        </div>
    )
}

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

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

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
            onChange(data.url)
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }, [onChange])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1
    })

    if (value) {
        return (
            <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 group">
                <Image
                    src={value}
                    alt="Show cover"
                    fill
                    className="object-cover"
                />
                <button
                    onClick={() => onChange('')}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        )
    }

    return (
        <div
            {...getRootProps()}
            className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'}
      `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload className="w-8 h-8 mb-2" />
                {uploading ? (
                    <p>Uploading...</p>
                ) : isDragActive ? (
                    <p className="text-blue-400">Drop the image here</p>
                ) : (
                    <>
                        <p className="font-medium text-gray-300">Drag & drop an image here</p>
                        <p className="text-sm">or click to select file</p>
                    </>
                )}
            </div>
        </div>
    )
}

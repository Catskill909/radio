'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import AlertModal from './AlertModal';

interface SiteLogoUploadProps {
    value?: string;
    onChange: (url: string) => void;
}

export default function SiteLogoUpload({ value, onChange }: SiteLogoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: ''
    });

    const showAlert = (title: string, message: string) => {
        setAlertState({ isOpen: true, title, message });
    };

    const closeAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    const resizeImage = (file: File, maxWidth: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);

                let width = img.width;
                let height = img.height;

                // Calculate new dimensions if resizing is needed
                if (width > maxWidth || height > maxWidth) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                } else {
                    // No resizing needed, return original file
                    // We can't return the File object directly as Blob, but we can resolve with it slice
                    resolve(file);
                    return;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // High quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    file.type,
                    0.9 // Quality
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image'));
            };

            img.src = objectUrl;
        });
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showAlert('Invalid File Type', 'Please upload a valid image file (PNG, JPG, WEBP).');
            return;
        }

        setUploading(true);

        try {
            // Resize image if larger than 2400px
            const resizedBlob = await resizeImage(file, 2400);

            // Create a new File object from the blob to upload
            const fileToUpload = new File([resizedBlob], file.name, {
                type: file.type,
                lastModified: Date.now(),
            });

            const formData = new FormData();
            formData.append('file', fileToUpload);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onChange(data.url);
        } catch (error) {
            console.error('Error uploading file:', error);
            showAlert('Upload Failed', 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [onChange]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        noClick: !!value // Disable click on the container if value exists (we'll use a specific button/overlay)
    });

    return (
        <>
            <div className="space-y-2 w-full h-full">
                {value ? (
                    <div className="relative w-full h-full min-h-[200px] bg-gray-900 rounded-lg overflow-hidden border border-gray-700 group">
                        <img
                            src={value}
                            alt="Site Logo"
                            className="w-full h-full object-contain bg-gray-900/50"
                            onError={(e) => {
                                // If image fails to load, show placeholder/error state
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('bg-gray-800', 'flex', 'items-center', 'justify-center');
                            }}
                        />
                        {/* Fallback content if image hides itself */}
                        <div className="absolute inset-0 -z-10 flex items-center justify-center text-gray-500">
                            <ImageIcon className="w-12 h-12 opacity-20" />
                        </div>

                        {/* Overlay for replacing image */}
                        <div
                            {...getRootProps()}
                            className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 cursor-pointer ${isDragActive ? 'opacity-100 bg-blue-500/20' : ''}`}
                            onClick={open}
                        >
                            <input {...getInputProps()} />
                            <Upload className="w-8 h-8 text-gray-200" />
                            <span className="text-sm font-medium text-gray-200">Replace</span>
                        </div>

                        {/* Remove button */}
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
                ) : (
                    <div
                        {...getRootProps()}
                        className={`
                            w-full h-full min-h-[200px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-blue-500/50 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2 p-4 text-gray-400">
                            <ImageIcon className="w-8 h-8 mb-1 text-gray-500" />
                            {uploading ? (
                                <p className="text-xs text-gray-300">Uploading...</p>
                            ) : isDragActive ? (
                                <p className="text-xs text-blue-400">Drop it!</p>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-gray-300">Upload Logo</p>
                                    <p className="text-[10px] text-gray-500 leading-tight mt-1">
                                        Drag & drop or click
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <AlertModal
                isOpen={alertState.isOpen}
                onClose={closeAlert}
                title={alertState.title}
                message={alertState.message}
            />
        </>
    );
}

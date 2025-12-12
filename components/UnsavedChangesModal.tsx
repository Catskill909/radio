'use client'

import { X, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

interface UnsavedChangesModalProps {
    isOpen: boolean
    onStay: () => void
    onDiscard: () => void
}

export default function UnsavedChangesModal({
    isOpen,
    onStay,
    onDiscard,
}: UnsavedChangesModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onStay() // Escape should keep the user in the modal
            }
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape, true)
        }
        return () => {
            document.removeEventListener('keydown', handleEscape, true)
        }
    }, [isOpen, onStay])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onStay}
            />

            {/* Modal */}
            <div className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start gap-4 p-6 border-b border-gray-700">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">Unsaved Changes</h2>
                        <p className="text-gray-400 mt-1 text-sm">
                            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                        </p>
                    </div>
                    <button
                        onClick={onStay}
                        className="flex-shrink-0 p-1 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6">
                    <button
                        onClick={onStay}
                        className="flex-1 px-4 py-3 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-white font-medium transition-all"
                    >
                        Stay & Continue Editing
                    </button>
                    <button
                        onClick={onDiscard}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-all"
                    >
                        Discard Changes
                    </button>
                </div>
            </div>
        </div>
    )
}

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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onStay}
            />

            {/* Modal */}
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start gap-4 p-5 border-b border-gray-700/50">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                            Unsaved Changes
                        </h2>
                        <p className="text-gray-400 mt-1 text-sm">
                            You have unsaved changes that will be lost.
                        </p>
                    </div>
                    <button
                        onClick={onStay}
                        className="flex-shrink-0 p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex gap-3 p-5">
                    <button
                        onClick={onStay}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-blue-500/50 hover:border-blue-400 bg-blue-500/5 hover:bg-blue-500/10 text-blue-100 font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] whitespace-nowrap"
                    >
                        Continue Editing
                    </button>
                    <button
                        onClick={onDiscard}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-gray-300 font-medium transition-all whitespace-nowrap"
                    >
                        Discard
                    </button>
                </div>
            </div>
        </div>
    )
}


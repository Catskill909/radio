'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface CreateShowModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
}

export default function CreateShowModal({
    isOpen,
    onClose,
    children,
}: CreateShowModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal - Full Screen */}
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-6xl max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 flex-shrink-0">
                    <h2 className="text-3xl font-bold text-white">Create New Show</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content - No scrolling needed with proper layout */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}

'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import UnsavedChangesModal from '@/components/UnsavedChangesModal'

interface EditShowModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    isDirty?: boolean
}

export default function EditShowModal({
    isOpen,
    onClose,
    children,
    title = 'Edit Show',
    isDirty = false,
}: EditShowModalProps) {
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)

    const handleCloseAttempt = () => {
        if (isDirty) {
            setShowUnsavedWarning(true)
        } else {
            onClose()
        }
    }

    const handleConfirmDiscard = () => {
        setShowUnsavedWarning(false)
        onClose()
    }

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCloseAttempt()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, isDirty])

    // Reset warning state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setShowUnsavedWarning(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={handleCloseAttempt}
                />

                {/* Modal */}
                <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                    {/* Fixed Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-800 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-white">{title}</h2>
                        <button
                            onClick={handleCloseAttempt}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto flex-1 p-6">
                        {children}
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Warning */}
            <UnsavedChangesModal
                isOpen={showUnsavedWarning}
                onStay={() => setShowUnsavedWarning(false)}
                onDiscard={handleConfirmDiscard}
            />
        </>
    )
}

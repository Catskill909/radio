'use client';

import { AlertCircle, X } from "lucide-react";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export default function AlertModal({
    isOpen,
    onClose,
    title,
    message
}: AlertModalProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 z-[80] transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
                    {/* Header */}
                    <div className="flex items-start gap-4 p-6 border-b border-gray-700">
                        <div className="p-3 rounded-full bg-red-900/30">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                            <p className="text-sm text-gray-400">{message}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="p-6">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

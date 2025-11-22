'use client'

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'warning'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'text-red-400',
            iconBg: 'bg-red-900/30',
            button: 'bg-red-600 hover:bg-red-700'
        },
        warning: {
            icon: 'text-yellow-400',
            iconBg: 'bg-yellow-900/30',
            button: 'bg-yellow-600 hover:bg-yellow-700'
        },
        info: {
            icon: 'text-blue-400',
            iconBg: 'bg-blue-900/30',
            button: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const styles = variantStyles[variant];

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
                        <div className={`p-3 rounded-full ${styles.iconBg}`}>
                            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
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
                    <div className="flex gap-3 p-6">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${styles.button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

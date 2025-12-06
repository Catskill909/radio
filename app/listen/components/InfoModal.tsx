'use client';

import { X } from 'lucide-react';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    icon: string;
    header: string;
    body: string;
}

export default function InfoModal({ isOpen, onClose, icon, header, body }: InfoModalProps) {
    if (!isOpen) return null;

    // Render body with line breaks preserved
    const renderBody = (text: string) => {
        return text.split('\n\n').map((paragraph, i) => (
            <p key={i} className="mb-4 last:mb-0 text-gray-300 leading-relaxed">
                {paragraph.split('\n').map((line, j) => (
                    <span key={j}>
                        {line}
                        {j < paragraph.split('\n').length - 1 && <br />}
                    </span>
                ))}
            </p>
        ));
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div
                    className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in overflow-hidden max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative p-6 pb-4 border-b border-gray-800 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                                <i className={`${icon} text-xl text-gray-200`} />
                            </div>
                            <h2 className="text-xl font-bold text-white">{header}</h2>
                        </div>
                    </div>

                    {/* Body - scrollable */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {renderBody(body)}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

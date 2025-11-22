'use client'

import { X } from "lucide-react";
import WaveSurferEditor from "./WaveSurferEditor";

interface AudioEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    audioUrl: string;
    filename: string;
    onSave?: (newDuration: number) => void;
}

export default function AudioEditorModal({ isOpen, onClose, audioUrl, filename, onSave }: AudioEditorModalProps) {
    if (!isOpen) return null;

    const handleSave = (newDuration: number) => {
        if (onSave) {
            onSave(newDuration);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 z-[80] transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Audio Editor</h2>
                            <p className="text-sm text-gray-400 mt-1">Trim and edit your audio file</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-hidden">
                        <WaveSurferEditor
                            audioUrl={audioUrl}
                            filename={filename}
                            onSave={handleSave}
                            onClose={onClose}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

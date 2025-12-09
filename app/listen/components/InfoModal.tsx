'use client';

import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    icon: string;
    header: string;
    body: string;
    size?: 'compact' | 'standard' | 'expanded';
}

// Size configurations for desktop/large tablets (≥768px)
// Widths increased for more spacious feel
const SIZE_CONFIG = {
    compact: {
        width: 'max-w-md',      // 448px (was 384px)
        maxHeight: 'max-h-[50vh]',
    },
    standard: {
        width: 'max-w-xl',      // 576px (was 512px)
        maxHeight: 'max-h-[65vh]',
    },
    expanded: {
        width: 'max-w-3xl',     // 768px (was 672px)
        maxHeight: 'max-h-[80vh]',
    },
};

export default function InfoModal({ isOpen, onClose, icon, header, body, size = 'standard' }: InfoModalProps) {
    const sizeConfig = SIZE_CONFIG[size];

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
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                {/* Backdrop */}
                <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm animate-fade-in" />

                {/* Modal - Responsive: Full screen on mobile, sized on desktop */}
                <Dialog.Content
                    className={`
                        fixed z-[70] bg-gray-950 border border-gray-800 shadow-2xl 
                        animate-scale-in overflow-hidden flex flex-col
                        outline-none
                        
                        /* Mobile: Full-screen overlay with padding */
                        inset-3 rounded-2xl
                        
                        /* Desktop: Centered with size presets */
                        md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                        md:w-full ${sizeConfig.width} ${sizeConfig.maxHeight}
                    `}
                    aria-describedby={undefined}
                >
                    {/* Header */}
                    <div className="relative p-6 pb-4 border-b border-gray-800/50 flex-shrink-0">
                        <Dialog.Close asChild>
                            <button
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 hover:rotate-90 outline-none cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </Dialog.Close>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-800/80 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className={`${icon} text-xl text-gray-200`} />
                            </div>
                            <Dialog.Title className="text-xl font-bold text-white pr-10">{header}</Dialog.Title>
                        </div>
                    </div>

                    {/* Body - scrollable with thin modern scrollbar */}
                    <div className="p-6 overflow-y-auto flex-1 thin-scrollbar">
                        {renderBody(body)}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

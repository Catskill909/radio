'use client';

import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Episode } from './types';
import { format } from 'date-fns';

interface EpisodeInfoModalProps {
    episode: Episode | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function EpisodeInfoModal({ episode, isOpen, onClose }: EpisodeInfoModalProps) {
    if (!episode) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                {/* Backdrop */}
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] animate-fade-in" />

                {/* Modal Content */}
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90vw] max-w-md bg-gray-900 rounded-2xl overflow-hidden shadow-2xl animate-fade-in border border-gray-800"
                    aria-describedby={undefined}
                >
                    <VisuallyHidden.Root>
                        <Dialog.Title>{episode.title}</Dialog.Title>
                    </VisuallyHidden.Root>

                    {/* Close button - smaller, top-right corner, solid background with animation */}
                    <Dialog.Close asChild>
                        <button
                            className="absolute top-3 right-3 z-10 w-7 h-7 bg-gray-700 text-gray-300 rounded-full flex items-center justify-center hover:bg-gray-600 hover:text-white hover:rotate-90 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </Dialog.Close>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex gap-4 mb-4">
                            {/* Episode Cover - Smaller, Left Side */}
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                                <img
                                    src={episode.coverImage || '/default-show.png'}
                                    alt={episode.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Title & Date */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-white mb-1 leading-tight line-clamp-2">
                                    {episode.title}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {format(new Date(episode.publishedAt), 'MMMM d, yyyy')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Duration: {Math.floor(episode.duration / 60)}m
                                </p>
                            </div>
                        </div>

                        {/* Description - Scrollable */}
                        {episode.description && (
                            <div className="border-t border-gray-800 pt-4">
                                <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Episode Info</h3>
                                <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {episode.description}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { X, Copy, Check, Calendar, Tag, Rss } from 'lucide-react';
import { ShowDetail, Episode } from './types';
import EpisodeCard from './EpisodeCard';

interface ShowModalProps {
    showId: string | null;
    isOpen: boolean;
    onClose: () => void;
    currentEpisodeId: string | null;
    onPlayEpisode: (episode: Episode) => void;
}

export default function ShowModal({
    showId,
    isOpen,
    onClose,
    currentEpisodeId,
    onPlayEpisode
}: ShowModalProps) {
    const [show, setShow] = useState<ShowDetail | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [scheduleInfo, setScheduleInfo] = useState<{ recurrence: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch show details when modal opens
    useEffect(() => {
        if (isOpen && showId) {
            setLoading(true);
            fetch(`/api/public/shows/${showId}`)
                .then(res => res.json())
                .then(data => {
                    setShow(data.show);
                    setEpisodes(data.episodes);
                    setScheduleInfo(data.schedule);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching show details:', err);
                    setLoading(false);
                });
        } else {
            setShow(null);
            setEpisodes([]);
        }
    }, [isOpen, showId]);

    // Handle copy RSS feed
    const handleCopyRss = () => {
        if (show?.rssFeedUrl) {
            const url = window.location.origin + show.rssFeedUrl;
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full sm:max-w-md h-[85vh] sm:h-[80vh] bg-gray-900 rounded-t-3xl sm:rounded-2xl overflow-hidden pointer-events-auto shadow-2xl flex flex-col animate-slide-up">
                {/* Header / Close */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={onClose}
                        className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors backdrop-blur"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Loading...
                    </div>
                ) : show ? (
                    <div className="flex-1 overflow-y-auto pb-8 no-scrollbar">
                        {/* Hero Image */}
                        <div className="relative w-full aspect-square">
                            <img
                                src={show.image || '/default-show.png'}
                                alt={show.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <div className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded mb-2 border border-blue-500/30">
                                    {show.type}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-1 leading-tight">{show.title}</h2>
                                {show.host && (
                                    <p className="text-gray-300 font-medium">with {show.host}</p>
                                )}
                            </div>
                        </div>

                        <div className="px-6 space-y-6">
                            {/* Tags */}
                            {show.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {show.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Schedule Info */}
                            {scheduleInfo?.recurrence && (
                                <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-800">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{scheduleInfo.recurrence}</span>
                                </div>
                            )}

                            {/* Description */}
                            {show.description && (
                                <div className="prose prose-invert prose-sm max-w-none text-gray-400 leading-relaxed">
                                    <p>{show.description}</p>
                                </div>
                            )}

                            {/* RSS Feed */}
                            <button
                                onClick={handleCopyRss}
                                className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors group"
                            >
                                <div className="p-1.5 bg-orange-500/10 rounded-md group-hover:bg-orange-500/20">
                                    <Rss className="w-3 h-3 text-orange-500" />
                                </div>
                                <span>RSS Feed</span>
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>

                            {/* Latest Episodes */}
                            {episodes.length > 0 && (
                                <div className="pt-4 border-t border-gray-800">
                                    <h3 className="text-lg font-bold text-white mb-4">Latest Episodes</h3>
                                    <div className="flex overflow-x-auto gap-3 pb-4 -mx-6 px-6 no-scrollbar snap-x">
                                        {episodes.map(episode => (
                                            <EpisodeCard
                                                key={episode.id}
                                                episode={episode}
                                                isPlaying={currentEpisodeId === episode.id}
                                                onPlay={() => onPlayEpisode(episode)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Show not found
                    </div>
                )}
            </div>
        </div>
    );
}

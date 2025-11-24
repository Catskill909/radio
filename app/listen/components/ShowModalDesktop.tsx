'use client';

import { useEffect, useState } from 'react';
import { X, Copy, Check, Calendar, Rss } from 'lucide-react';
import { ShowDetail, Episode } from './types';
import EpisodeCard from './EpisodeCard';

interface ShowModalDesktopProps {
    showId: string | null;
    isOpen: boolean;
    onClose: () => void;
    currentEpisodeId: string | null;
    onPlayEpisode: (episode: Episode) => void;
}

export default function ShowModalDesktop({
    showId,
    isOpen,
    onClose,
    currentEpisodeId,
    onPlayEpisode
}: ShowModalDesktopProps) {
    const [show, setShow] = useState<ShowDetail | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [scheduleInfo, setScheduleInfo] = useState<{ recurrence: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

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
        }
    }, [isOpen, showId]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-[900px] h-[600px] bg-gray-900 rounded-2xl overflow-hidden pointer-events-auto shadow-2xl flex animate-fade-in border border-gray-800">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
                ) : show ? (
                    <div className="flex w-full h-full">
                        {/* LEFT COLUMN (40%) */}
                        <div className="w-[40%] bg-gray-900 p-8 flex flex-col border-r border-gray-800 overflow-y-auto custom-scrollbar">
                            <div className="aspect-square w-full rounded-xl overflow-hidden mb-6 shadow-lg">
                                <img
                                    src={show.image || '/default-show.png'}
                                    alt={show.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="mb-6">
                                <div className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded mb-2 border border-blue-500/30">
                                    {show.type}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-1 leading-tight">{show.title}</h2>
                                {show.host && (
                                    <p className="text-gray-400 font-medium">with {show.host}</p>
                                )}
                            </div>

                            {show.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {show.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {scheduleInfo?.recurrence && (
                                <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-800 mb-6">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{scheduleInfo.recurrence}</span>
                                </div>
                            )}

                            <div className="mt-auto pt-6 border-t border-gray-800">
                                <button
                                    onClick={handleCopyRss}
                                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors group w-full justify-center p-2 rounded hover:bg-gray-800"
                                >
                                    <Rss className="w-3 h-3 text-orange-500" />
                                    <span>Copy RSS Feed</span>
                                    {copied && <Check className="w-3 h-3 text-green-500" />}
                                </button>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (60%) */}
                        <div className="w-[60%] bg-gray-950 p-8 flex flex-col overflow-hidden">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white">Latest Episodes</h3>
                                <p className="text-sm text-gray-500">Listen to past shows</p>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                {episodes.length > 0 ? (
                                    episodes.map(episode => (
                                        <div key={episode.id} className="w-full">
                                            <EpisodeCard
                                                episode={episode}
                                                isPlaying={currentEpisodeId === episode.id}
                                                onPlay={() => onPlayEpisode(episode)}
                                                fullWidth
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-12">No episodes available.</p>
                                )}
                            </div>

                            {show.description && (
                                <div className="mt-6 pt-6 border-t border-gray-800">
                                    <h4 className="text-sm font-bold text-gray-400 mb-2">About the Show</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
                                        {show.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">Show not found</div>
                )}
            </div>
        </div>
    );
}

'use client'

import { useState, useEffect } from "react";
import { Copy, ExternalLink, Rss, Mic, Calendar, List, Play } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import AudioPlayer from "./AudioPlayer";
import EpisodeManagerDrawer from "./EpisodeManagerDrawer";

interface PodcastCardProps {
    show: any;
}

export default function PodcastCard({ show }: PodcastCardProps) {
    const [copied, setCopied] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showPlayer, setShowPlayer] = useState(false);

    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    useEffect(() => {
        // Delay player mount to stagger metadata loading
        const timer = setTimeout(() => {
            setShowPlayer(true);
        }, Math.random() * 500); // Random delay 0-500ms to stagger loads

        return () => clearTimeout(timer);
    }, []);

    const feedUrl = `${origin}/api/feed/${show.id}/rss.xml`;

    const handleCopy = () => {
        navigator.clipboard.writeText(feedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all">
            <div className="p-6">
                <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex items-start gap-4">
                        {/* Show Art / Placeholder */}
                        <div className="w-24 h-24 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-600">
                            {show.image ? (
                                <img src={show.image} alt={show.title} className="w-full h-full object-cover" />
                            ) : (
                                <Mic className="w-10 h-10 text-gray-500" />
                            )}
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{show.title}</h2>
                            <div className="text-gray-400 text-sm mb-3">
                                {show.host && <span className="mr-3">Host: {show.host}</span>}
                                <span>{show.totalEpisodes} Episodes</span>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2 max-w-xl">
                                {show.description || "No description available."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Manage Episodes Button */}
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <List className="w-4 h-4" />
                            Manage Episodes
                            <span className="px-2 py-0.5 bg-gray-600 rounded-full text-xs">
                                {show.totalEpisodes}
                            </span>
                        </button>

                        {/* RSS Feed Box */}
                        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                            <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
                                <Rss className="w-3 h-3" />
                                Podcast Feed
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-gray-950 rounded border border-gray-800 px-3 py-2 text-xs text-gray-400 font-mono truncate select-all">
                                    {feedUrl}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
                                    title="Copy RSS URL"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <a
                                    href={feedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
                                    title="Open Feed"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            {copied && (
                                <div className="text-green-400 text-xs mt-1 text-right">
                                    Copied to clipboard!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Latest Episode Section */}
                {show.latestEpisode ? (
                    <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/30">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Latest Episode</span>
                            </div>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(show.latestEpisode.publishedAt || show.latestEpisode.createdAt), "PPP")}
                            </span>
                        </div>

                        <h3 className="text-lg font-semibold mb-1">{show.latestEpisode.title}</h3>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-1">{show.latestEpisode.description}</p>

                        <div className="w-full">
                            {showPlayer ? (
                                <AudioPlayer
                                    src={`/api/audio/${show.latestEpisode.recording.filePath}`}
                                    title={show.latestEpisode.title}
                                />
                            ) : (
                                <div className="h-16 bg-gray-700/30 rounded-lg animate-pulse"></div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-900/30 rounded-lg p-6 border border-gray-700/30 text-center text-gray-500 text-sm">
                        No episodes published yet.
                    </div>
                )}
            </div>

            {/* Episode Manager Drawer */}
            <EpisodeManagerDrawer
                showId={show.id}
                showTitle={show.title}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />
        </div>
    );
}

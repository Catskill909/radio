"use client";

import { useState } from "react";
import { X, Copy, Check, Rss, ExternalLink } from "lucide-react";

interface RssFeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    feedUrl: string;
    title: string;
}

export function RssFeedModal({ isOpen, onClose, feedUrl, title }: RssFeedModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(feedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-pink-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Rss className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Instructions */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">
                            📱 How to Subscribe
                        </h3>
                        <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                            <li>Copy the feed URL below</li>
                            <li>Open your favorite podcast app</li>
                            <li>Look for "Add by URL" or "Subscribe via RSS"</li>
                            <li>Paste the URL and subscribe</li>
                        </ol>
                    </div>

                    {/* Feed URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            RSS Feed URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={feedUrl}
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-white font-medium flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Test Feed Link */}
                    <div className="flex items-center justify-between bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300">Preview Feed</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Open the raw XML feed in a new tab
                            </p>
                        </div>
                        <a
                            href={feedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white text-sm flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open Feed
                        </a>
                    </div>

                    {/* Podcast Apps */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-3">
                            Popular Podcast Apps
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { name: "Apple Podcasts", icon: "🎧" },
                                { name: "Spotify", icon: "🎵" },
                                { name: "Pocket Casts", icon: "📻" },
                                { name: "Overcast", icon: "☁️" },
                            ].map((app) => (
                                <div
                                    key={app.name}
                                    className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center"
                                >
                                    <div className="text-2xl mb-1">{app.icon}</div>
                                    <div className="text-xs text-gray-400">{app.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-800/50 px-6 py-3 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

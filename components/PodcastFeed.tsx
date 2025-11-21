"use client";

import { useState } from "react";
import { Rss, Copy, Check } from "lucide-react";
import { Tooltip } from "./Tooltip";

interface PodcastFeedProps {
    feedUrl: string;
    title?: string;
}

export function PodcastFeed({ feedUrl, title = "Podcast Feed" }: PodcastFeedProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(feedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gradient-to-r from-orange-900/20 to-pink-900/20 border border-orange-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
                <Rss className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-semibold text-orange-200">{title}</span>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    readOnly
                    value={feedUrl}
                    className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 font-mono"
                />
                <Tooltip content="Copy to clipboard">
                    <button
                        onClick={copyToClipboard}
                        className="p-2 bg-orange-600 hover:bg-orange-700 rounded transition-colors text-white"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </Tooltip>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Subscribe to this feed in your favorite podcast app
            </p>
        </div>
    );
}

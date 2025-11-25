'use client'

import { useState, useMemo } from 'react'
import PodcastCard from "@/components/PodcastCard"
import { Rss, Search, X } from "lucide-react"

interface EpisodesClientProps {
    initialShows: any[]
    timezone: string
}

export default function EpisodesClient({ initialShows, timezone }: EpisodesClientProps) {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter shows based on search query
    const filteredShows = useMemo(() => {
        if (!searchQuery.trim()) return initialShows

        const query = searchQuery.toLowerCase()
        return initialShows.filter(show =>
            show.title.toLowerCase().includes(query) ||
            show.host?.toLowerCase().includes(query) ||
            show.description?.toLowerCase().includes(query) ||
            show.type.toLowerCase().includes(query) ||
            show.episodes.some((episode: any) =>
                episode.title.toLowerCase().includes(query) ||
                episode.description?.toLowerCase().includes(query)
            )
        )
    }, [initialShows, searchQuery])

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Podcast Dashboard</h1>
                    <p className="text-gray-400">Manage your podcast feeds and view latest episodes.</p>
                </div>
            </div>

            {/* Search Box */}
            <div className="relative max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-500" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shows by title, host, type, or episodes..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-11 pr-11 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Results count when searching */}
            {searchQuery && (
                <p className="text-sm text-gray-400">
                    Found {filteredShows.length} {filteredShows.length === 1 ? 'show' : 'shows'}
                </p>
            )}

            <div className="grid grid-cols-1 gap-6">
                {filteredShows.map((show: any) => (
                    <PodcastCard key={show.id} show={show} timezone={timezone} />
                ))}

                {filteredShows.length === 0 && (
                    <div className="text-center py-16 bg-gray-800 border border-gray-700 rounded-xl">
                        <Rss className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        {searchQuery ? (
                            <>
                                <h3 className="text-xl font-semibold mb-2">No Shows Found</h3>
                                <p className="text-gray-400">No shows match &quot;{searchQuery}&quot;</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-semibold mb-2">No Shows Found</h3>
                                <p className="text-gray-400">Create a show to start generating a podcast feed.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

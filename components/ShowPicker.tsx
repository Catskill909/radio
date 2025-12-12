'use client'

import { useState, useMemo } from 'react'
import { Search, X, Music, Mic2, Radio } from 'lucide-react'
import Image from 'next/image'

interface Show {
    id: string
    title: string
    type: string
    image?: string | null
    host?: string | null
}

interface ShowPickerProps {
    shows: Show[]
    selectedShowId: string
    onSelect: (showId: string) => void
}

export default function ShowPicker({ shows, selectedShowId, onSelect }: ShowPickerProps) {
    const [searchQuery, setSearchQuery] = useState('')

    // Sort shows alphabetically and filter by search
    const filteredShows = useMemo(() => {
        const sorted = [...shows].sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
        )

        if (!searchQuery.trim()) return sorted

        const query = searchQuery.toLowerCase()
        return sorted.filter(show =>
            show.title.toLowerCase().includes(query) ||
            show.host?.toLowerCase().includes(query) ||
            show.type.toLowerCase().includes(query)
        )
    }, [shows, searchQuery])

    // Get icon and color for show type
    const getTypeStyle = (type: string) => {
        const lowerType = type.toLowerCase()
        const commonStyle = {
            bgColor: 'bg-gray-700',
            textColor: 'text-gray-300'
        }

        if (lowerType.includes('music')) {
            return {
                icon: Music,
                ...commonStyle,
                label: lowerType.includes('syndicated') ? 'Syndicated Music' : 'Local Music'
            }
        } else if (lowerType.includes('podcast')) {
            return {
                icon: Mic2,
                ...commonStyle,
                label: lowerType.includes('syndicated') ? 'Syndicated Podcast' : 'Local Podcast'
            }
        } else {
            return {
                icon: Radio,
                ...commonStyle,
                label: type
            }
        }
    }

    return (
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shows..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Cards Grid */}
            <div className="max-h-64 overflow-y-auto pr-1 -mr-1">
                {filteredShows.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchQuery ? (
                            <p>No shows match "{searchQuery}"</p>
                        ) : (
                            <p>No shows available</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {filteredShows.map((show) => {
                            const isSelected = show.id === selectedShowId
                            const typeStyle = getTypeStyle(show.type)
                            const TypeIcon = typeStyle.icon

                            return (
                                <button
                                    key={show.id}
                                    onClick={() => onSelect(show.id)}
                                    className={`group relative flex flex-col items-center p-2 rounded-lg border transition-all text-left ${isSelected
                                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
                                        }`}
                                >
                                    {/* Image */}
                                    <div className="w-full aspect-square rounded-md overflow-hidden bg-gray-700 mb-1.5 relative">
                                        {show.image ? (
                                            <Image
                                                src={show.image}
                                                alt={show.title}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <TypeIcon className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <p className={`text-xs font-medium text-center leading-tight line-clamp-2 w-full ${isSelected ? 'text-blue-300' : 'text-gray-200'
                                        }`}>
                                        {show.title}
                                    </p>

                                    {/* Type Badge */}
                                    <div className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${typeStyle.bgColor} ${typeStyle.textColor}`}>
                                        {typeStyle.label}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Selected indicator */}
            {selectedShowId && (
                <p className="text-xs text-gray-500">
                    Selected: <span className="text-blue-400">{shows.find(s => s.id === selectedShowId)?.title}</span>
                </p>
            )}
        </div>
    )
}

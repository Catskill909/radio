'use client'

import { useState, useMemo } from 'react'
import { getShows, deleteShow } from "@/app/actions"
import Link from "next/link"
import { Plus, Edit, Trash2, Rss, Search, X } from "lucide-react"
import DeleteConfirmModal from "@/components/DeleteConfirmModal"
import EditShowModal from "@/components/EditShowModal"
import EditShowForm from "@/components/EditShowForm"
import { RssFeedModal } from "@/components/RssFeedModal"
import { Tooltip } from "@/components/Tooltip"

interface Show {
    id: string
    title: string
    description: string | null
    type: string
    image: string | null
    host: string | null
    email: string | null
    author: string | null
    explicit: boolean
    category: string | null
    tags: string | null
    recordingEnabled: boolean
    recordingSource: string | null
    language: string
    copyright: string | null
    link: string | null
    createdAt: Date
    updatedAt: Date
}

interface ShowsClientProps {
    initialShows: Show[]
    streams: { id: string; name: string; url: string }[]
}

export default function ShowsClient({ initialShows, streams }: ShowsClientProps) {
    const [shows, setShows] = useState(initialShows)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [rssModalOpen, setRssModalOpen] = useState(false)
    const [selectedShow, setSelectedShow] = useState<Show | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Filter shows based on search query
    const filteredShows = useMemo(() => {
        if (!searchQuery.trim()) return shows

        const query = searchQuery.toLowerCase()
        return shows.filter(show =>
            show.title.toLowerCase().includes(query) ||
            show.host?.toLowerCase().includes(query) ||
            show.description?.toLowerCase().includes(query) ||
            show.type.toLowerCase().includes(query) ||
            show.tags?.toLowerCase().includes(query)
        )
    }, [shows, searchQuery])

    const handleDelete = async () => {
        if (selectedShow) {
            await deleteShow(selectedShow.id)
            setShows(shows.filter(s => s.id !== selectedShow.id))
            setDeleteModalOpen(false)
            setSelectedShow(null)
        }
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>Shows</h1>
                    <Link
                        href="/shows/new"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-white font-medium transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Show
                    </Link>
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
                        placeholder="Search shows by title, host, type, or tags..."
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredShows.map((show) => (
                        <div
                            key={show.id}
                            className="bg-[#1e1e1e] border border-[#333] rounded-lg overflow-hidden hover:border-[#444] transition-all shadow-md flex flex-col"
                        >
                            <div className="flex flex-row h-full">
                                {show.image && (
                                    <div className="w-1/3 relative shrink-0">
                                        <img
                                            src={show.image}
                                            alt={show.title}
                                            className="w-full h-full object-cover absolute inset-0"
                                        />
                                    </div>
                                )}
                                <div className={`flex-1 p-5 flex flex-col ${show.image ? 'w-2/3' : 'w-full'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h2 className="text-lg font-medium text-gray-100 leading-tight mb-1">{show.title}</h2>
                                            {show.host && (
                                                <p className="text-xs text-gray-400">Host: {show.host}</p>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 bg-[#2a2a2a] px-2 py-0.5 rounded border border-[#333]">
                                            {show.type}
                                        </span>
                                    </div>

                                    {show.description && (
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{show.description}</p>
                                    )}

                                    <div className="flex items-center gap-2 mt-auto pt-2">
                                        <button
                                            onClick={() => {
                                                setSelectedShow(show)
                                                setRssModalOpen(true)
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs rounded border border-[#333] transition-colors"
                                        >
                                            <Rss className="w-3 h-3" />
                                            Feed
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedShow(show)
                                                setEditModalOpen(true)
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs rounded border border-[#333] transition-colors"
                                        >
                                            <Edit className="w-3 h-3" />
                                            Edit
                                        </button>
                                        <div className="flex-grow"></div>
                                        <Tooltip content="Delete Show">
                                            <button
                                                onClick={() => {
                                                    setSelectedShow(show)
                                                    setDeleteModalOpen(true)
                                                }}
                                                className="flex items-center justify-center p-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredShows.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            {searchQuery
                                ? `No shows found matching "${searchQuery}"`
                                : 'No shows created yet. Click "Create Show" to get started.'
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false)
                    setSelectedShow(null)
                }}
                onConfirm={handleDelete}
                title="Delete Show"
                message={`Are you sure you want to delete "${selectedShow?.title}"? This will also delete all associated schedule slots. This action cannot be undone.`}
            />

            {/* Edit Show Modal */}
            <EditShowModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false)
                    setSelectedShow(null)
                }}
                title="Edit Show"
            >
                {selectedShow && <EditShowForm show={selectedShow} streams={streams} />}
            </EditShowModal>

            {/* RSS Feed Modal */}
            {selectedShow && (
                <RssFeedModal
                    isOpen={rssModalOpen}
                    onClose={() => {
                        setRssModalOpen(false)
                        setSelectedShow(null)
                    }}
                    feedUrl={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/feed/show/${selectedShow.id}`}
                    title={`${selectedShow.title} Podcast Feed`}
                />
            )}
        </>
    )
}

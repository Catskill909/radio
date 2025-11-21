'use client'

import { useState } from 'react'
import { getShows, deleteShow } from "@/app/actions"
import Link from "next/link"
import { Plus, Edit, Trash2, Rss } from "lucide-react"
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
    recordingEnabled: boolean
    recordingSource: string | null
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Create Show
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shows.map((show) => (
                        <div
                            key={show.id}
                            className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all hover:shadow-lg"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold mb-2">{show.title}</h2>
                                    {show.host && (
                                        <p className="text-sm text-gray-400 mb-2">Host: {show.host}</p>
                                    )}
                                    <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full inline-block">
                                        {show.type}
                                    </span>
                                </div>
                            </div>

                            {show.description && (
                                <p className="text-gray-400 line-clamp-3 mb-4">{show.description}</p>
                            )}

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => {
                                        setSelectedShow(show)
                                        setRssModalOpen(true)
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
                                >
                                    <Rss className="w-4 h-4" />
                                    Podcast Feed
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedShow(show)
                                        setEditModalOpen(true)
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <Tooltip content="Delete Show">
                                    <button
                                        onClick={() => {
                                            setSelectedShow(show)
                                            setDeleteModalOpen(true)
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    ))}

                    {shows.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No shows created yet. Click "Create Show" to get started.
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

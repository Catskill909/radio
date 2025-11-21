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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {shows.map((show) => (
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

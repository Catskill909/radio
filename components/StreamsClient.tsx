'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import StreamCard from '@/components/StreamCard'
import AddStreamModal from '@/components/AddStreamModal'

interface Stream {
    id: string
    name: string
    url: string
    isEnabled: boolean
    status: string
    bitrate?: number | null
    format?: string | null
    listeners?: number | null
    maxListeners?: number | null
    genre?: string | null
    description?: string | null
    lastChecked?: Date | null
    errorMessage?: string | null
}

interface StreamsClientProps {
    initialStreams: Stream[]
}

export default function StreamsClient({ initialStreams }: StreamsClientProps) {
    const [streams] = useState(initialStreams)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [editStream, setEditStream] = useState<{ id: string; name: string; url: string } | null>(null)

    const handleEdit = (stream: Stream) => {
        setEditStream({
            id: stream.id,
            name: stream.name,
            url: stream.url,
        })
        setAddModalOpen(true)
    }

    const handleCloseModal = () => {
        setAddModalOpen(false)
        setEditStream(null)
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                            Icecast Streams
                        </h1>
                        <p className="text-gray-400">
                            Manage your radio streams with real-time monitoring and health checks
                        </p>
                    </div>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Add Stream
                    </button>
                </div>

                {/* Streams Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {streams.map((stream) => (
                        <StreamCard
                            key={stream.id}
                            stream={stream}
                            onEdit={() => handleEdit(stream)}
                        />
                    ))}

                    {streams.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700">
                            <p className="text-lg mb-2">No streams configured yet</p>
                            <p className="text-sm">Click "Add Stream" to get started</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Stream Modal */}
            <AddStreamModal
                isOpen={addModalOpen}
                onClose={handleCloseModal}
                editStream={editStream}
            />
        </>
    )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import StreamCard from '@/components/StreamCard'
import AddStreamModal from '@/components/AddStreamModal'
import HelpIcon from '@/components/HelpIcon'
import { formatDistanceToNow } from 'date-fns'
import { useSocket } from '@/hooks/useSocket'

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
    const [streams, setStreams] = useState(initialStreams)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [editStream, setEditStream] = useState<{ id: string; name: string; url: string } | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const [playingStreamId, setPlayingStreamId] = useState<string | null>(null)
    const [isLoadingStream, setIsLoadingStream] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // WebSocket connection
    const { isConnected, subscribe, on } = useSocket()

    // Subscribe to stream health updates via WebSocket
    useEffect(() => {
        if (!isConnected) return

        // Subscribe to stream-health channel
        subscribe('stream-health')

        // Listen for stream status updates
        const cleanup = on('stream:health', (data: {
            id: string;
            status: string;
            listeners?: number | null;
            errorMessage?: string | null;
        }) => {
            console.log('[WebSocket] Received stream:health update:', data)

            // Update the specific stream in state
            setStreams(prev => prev.map(stream =>
                stream.id === data.id
                    ? {
                        ...stream,
                        status: data.status,
                        listeners: data.listeners ?? stream.listeners,
                        errorMessage: data.errorMessage ?? stream.errorMessage,
                        lastChecked: new Date()
                    }
                    : stream
            ))
            setLastUpdate(new Date())
        })

        return cleanup
    }, [isConnected, subscribe, on])

    // Initialize Audio Element
    useEffect(() => {
        if (audioRef.current) return

        const audio = new Audio()
        audio.preload = 'none'

        const handleLoadStart = () => setIsLoadingStream(true)
        const handleCanPlay = () => setIsLoadingStream(false)
        const handleError = () => {
            setIsLoadingStream(false)
            setPlayingStreamId(null)
        }
        const handleEnded = () => {
            setIsLoadingStream(false)
            setPlayingStreamId(null)
        }

        audio.addEventListener('loadstart', handleLoadStart)
        audio.addEventListener('canplay', handleCanPlay)
        audio.addEventListener('error', handleError)
        audio.addEventListener('ended', handleEnded)

        audioRef.current = audio

        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('loadstart', handleLoadStart)
                audioRef.current.removeEventListener('canplay', handleCanPlay)
                audioRef.current.removeEventListener('error', handleError)
                audioRef.current.removeEventListener('ended', handleEnded)
                audioRef.current.pause()
                audioRef.current.src = ''
                audioRef.current = null
            }
        }
    }, [])

    const handlePlay = async (streamId: string, url: string) => {
        const audio = audioRef.current
        if (!audio) return

        if (playingStreamId === streamId) {
            // Stop playing
            audio.pause()
            audio.src = ''
            setPlayingStreamId(null)
            setIsLoadingStream(false)
        } else {
            // Start playing new stream
            try {
                setIsLoadingStream(true)
                setPlayingStreamId(streamId)
                audio.src = url
                await audio.play()
            } catch (error) {
                console.error('Playback failed:', error)
                setPlayingStreamId(null)
                setIsLoadingStream(false)
            }
        }
    }

    // Fallback polling - less frequent when WebSocket is connected
    useEffect(() => {
        const checkStreamHealth = async () => {
            try {
                const response = await fetch('/api/streams/health')
                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.streams) {
                        setStreams(data.streams)
                        setLastUpdate(new Date())
                    }
                }
            } catch (error) {
                console.error('Failed to check stream health:', error)
            }
        }

        // Check immediately on mount
        checkStreamHealth()

        // Poll less frequently when WebSocket is connected (60s vs 30s)
        const interval = setInterval(checkStreamHealth, isConnected ? 60000 : 30000)

        return () => clearInterval(interval)
    }, [isConnected])

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

    const handleManualRefresh = async () => {
        setIsRefreshing(true)
        try {
            const response = await fetch('/api/streams/health')
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.streams) {
                    setStreams(data.streams)
                    setLastUpdate(new Date())
                }
            }
        } catch (error) {
            console.error('Failed to refresh streams:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                            Icecast Streams
                            <HelpIcon articleId="adding-icecast-streams" tooltip="Learn about adding streams" />
                        </h1>
                        <p className="text-gray-400">
                            Manage your radio streams with real-time monitoring and health checks
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span>Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
                            {isConnected ? (
                                <span className="flex items-center gap-1 text-green-500" title="Real-time updates active">
                                    <Wifi className="w-3 h-3" /> Live
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-gray-600" title="Polling every 30s">
                                    <WifiOff className="w-3 h-3" /> Polling
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-white font-medium transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Add Stream
                        </button>
                    </div>
                </div>

                {/* Streams Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {streams.map((stream) => (
                        <StreamCard
                            key={stream.id}
                            stream={stream}
                            onEdit={() => handleEdit(stream)}
                            isPlaying={playingStreamId === stream.id}
                            isLoading={playingStreamId === stream.id && isLoadingStream}
                            onTogglePlay={() => handlePlay(stream.id, stream.url)}
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

'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { formatDistanceToNow } from 'date-fns'
import {
    Activity,
    Radio,
    Mic,
    Wifi,
    WifiOff,
    CheckCircle,
    XCircle,
    Clock,
    Play,
    AlertTriangle
} from 'lucide-react'
import StationClock from '@/components/StationClock'
import HelpIcon from '@/components/HelpIcon'

interface StreamStatus {
    id: string
    name: string
    status: 'online' | 'offline' | 'error' | 'unknown'
    listeners?: number
}

interface RecordingEvent {
    type: 'started' | 'completed' | 'failed'
    showTitle: string
    slotId: string
    recordingId?: string
    error?: string
    timestamp: Date
}

export default function StatsPage() {
    const { isConnected, subscribe, on } = useSocket()
    const [streams, setStreams] = useState<StreamStatus[]>([])
    const [recordingEvents, setRecordingEvents] = useState<RecordingEvent[]>([])
    const [siteListeners, setSiteListeners] = useState(0)
    const [isMounted, setIsMounted] = useState(false)
    const [timezone, setTimezone] = useState('UTC')

    // Avoid hydration mismatch
    useEffect(() => {
        setIsMounted(true)
        // Fetch timezone
        fetch('/api/station-settings')
            .then(res => res.json())
            .then(data => {
                if (data.timezone) setTimezone(data.timezone)
            })
            .catch(err => console.error('Failed to fetch settings:', err))
    }, [])

    // Subscribe to WebSocket events
    useEffect(() => {
        if (!isConnected) return

        subscribe('stream-health')
        subscribe('recording-status')
        subscribe('stats') // Receive listener count updates

        const cleanupStream = on('stream:health', (data: any) => {
            setStreams(prev => {
                const existing = prev.findIndex(s => s.id === data.id)
                const updated: StreamStatus = {
                    id: data.id,
                    name: data.name,
                    status: data.status,
                    listeners: data.listeners
                }
                if (existing >= 0) {
                    const newStreams = [...prev]
                    newStreams[existing] = updated
                    return newStreams
                }
                return [...prev, updated]
            })
        })

        const cleanupRecording = on('recording:started', (data: any) => {
            setRecordingEvents(prev => {
                // Check if this slotId already exists to avoid duplicates
                if (prev.some(e => e.slotId === data.slotId && e.type === 'started')) {
                    return prev
                }
                return [{
                    type: 'started' as const,
                    showTitle: data.showTitle,
                    slotId: data.slotId,
                    recordingId: data.recordingId,
                    timestamp: new Date()
                }, ...prev].slice(0, 10)
            })
        })

        const cleanupCompleted = on('recording:completed', (data: any) => {
            setRecordingEvents(prev => {
                // Remove the 'started' event for this slot since it's now completed
                const filtered = prev.filter(e => !(e.slotId === data.slotId && e.type === 'started'))
                return [{
                    type: 'completed' as const,
                    showTitle: data.showTitle,
                    slotId: data.slotId,
                    recordingId: data.recordingId,
                    timestamp: new Date()
                }, ...filtered].slice(0, 10)
            })
        })

        const cleanupFailed = on('recording:failed', (data: any) => {
            setRecordingEvents(prev => {
                // Remove the 'started' event for this slot since it failed
                const filtered = prev.filter(e => !(e.slotId === data.slotId && e.type === 'started'))
                return [{
                    type: 'failed' as const,
                    showTitle: data.showTitle,
                    slotId: data.slotId,
                    error: data.error,
                    timestamp: new Date()
                }, ...filtered].slice(0, 10)
            })
        })

        const cleanupListeners = on('listeners:count', (data: { count: number }) => {
            setSiteListeners(data.count)
        })

        return () => {
            cleanupStream()
            cleanupRecording()
            cleanupCompleted()
            cleanupFailed()
            cleanupListeners()
        }
    }, [isConnected, subscribe, on])

    // Fetch initial stream data
    useEffect(() => {
        fetch('/api/streams')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setStreams(data.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        status: s.status || 'unknown',
                        listeners: s.listeners
                    })))
                }
            })
            .catch(err => console.error('Failed to fetch streams:', err))
    }, [])

    // Fetch recent recordings on page load
    useEffect(() => {
        fetch('/api/stats/recent-recordings')
            .then(res => res.json())
            .then(data => {
                if (data.events && Array.isArray(data.events)) {
                    setRecordingEvents(prev => {
                        // Merge with any real-time events, avoiding duplicates
                        const existingIds = new Set(prev.map(e => e.slotId))
                        const newEvents = data.events.filter((e: any) => !existingIds.has(e.slotId))
                        return [...prev, ...newEvents].slice(0, 10)
                    })
                }
            })
            .catch(err => console.error('Failed to fetch recent recordings:', err))
    }, [])

    const onlineStreams = streams.filter(s => s.status === 'online').length
    const totalListeners = streams.reduce((sum, s) => sum + (s.listeners || 0), 0)

    return (
        <div className="h-full flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gray-950 pb-4 pt-6 px-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        Station Stats
                        <HelpIcon articleId="station-stats" tooltip="Monitor your station's real-time activity and health." />
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        {isConnected ? (
                            <span className="flex items-center gap-2 text-green-500 text-sm">
                                <Wifi className="w-4 h-4" />
                                Live Updates
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-gray-500 text-sm">
                                <WifiOff className="w-4 h-4" />
                                Connecting...
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <StationClock timezone={timezone} />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* WebSocket Status */}
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-6 h-6 text-blue-400" />
                            <h2 className="text-lg font-semibold">WebSocket</h2>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Status</span>
                                <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                                    {isConnected ? 'Connected' : 'Connecting...'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Channels</span>
                                <span className="text-gray-200 text-right text-sm">2 active</span>
                            </div>
                        </div>
                    </div>

                    {/* Stream Health */}
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Radio className="w-6 h-6 text-purple-400" />
                            <h2 className="text-lg font-semibold">Streams</h2>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Online</span>
                                <span className="text-green-400">{onlineStreams} / {streams.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Site Listeners</span>
                                <span className={siteListeners > 0 ? 'text-green-400' : 'text-gray-200'}>{siteListeners}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recording Activity */}
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Mic className="w-6 h-6 text-red-400" />
                            <h2 className="text-lg font-semibold">Recordings</h2>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Recent Events</span>
                                <span className="text-gray-200">{recordingEvents.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Last Activity</span>
                                <span className="text-gray-200">
                                    {isMounted && recordingEvents.length > 0
                                        ? (recordingEvents[0].type === 'started' ? 'in progress' : formatDistanceToNow(recordingEvents[0].timestamp, { addSuffix: true }))
                                        : 'None yet'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recording Events Log */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            Recording Event Log
                        </h2>
                        <a
                            href="/recordings"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            View All →
                        </a>
                    </div>
                    {recordingEvents.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                            No recording events yet. Events will appear here in real-time when recordings start, complete, or fail.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {recordingEvents.map((event, i) => (
                                <div key={i} className="flex items-center gap-3 py-2 px-3 bg-gray-900/50 rounded-lg">
                                    {event.type === 'started' && (
                                        <Play className="w-4 h-4 text-blue-400" />
                                    )}
                                    {event.type === 'completed' && (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    )}
                                    {event.type === 'failed' && (
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                    )}
                                    <span className="text-gray-200 flex-1">{event.showTitle}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${event.type === 'started' ? 'bg-blue-900/50 text-blue-300' :
                                        event.type === 'completed' ? 'bg-green-900/50 text-green-300' :
                                            'bg-red-900/50 text-red-300'
                                        }`}>
                                        {event.type}
                                    </span>
                                    {isMounted && (
                                        <span className="text-xs text-gray-500">
                                            {event.type === 'started' ? 'in progress' : formatDistanceToNow(event.timestamp, { addSuffix: true })}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stream Status Table */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Radio className="w-5 h-5 text-gray-400" />
                        Stream Status
                    </h2>
                    {streams.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No streams configured.</p>
                    ) : (
                        <div className="space-y-2">
                            {streams.map(stream => (
                                <div key={stream.id} className="flex items-center gap-3 py-2 px-3 bg-gray-900/50 rounded-lg">
                                    {stream.status === 'online' ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-400" />
                                    )}
                                    <span className="text-gray-200 flex-1">{stream.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${stream.status === 'online' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                                        }`}>
                                        {stream.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

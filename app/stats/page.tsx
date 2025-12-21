'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { formatDistanceToNow, format } from 'date-fns'
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
    AlertTriangle,
    Loader2,
    TrendingUp,
    Users,
    Download,
    BarChart3,
    Podcast
} from 'lucide-react'
import StationClock from '@/components/StationClock'
import HelpIcon from '@/components/HelpIcon'
import EngagementLineChart from '@/components/EngagementLineChart'

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

interface EngagementData {
    overview: {
        totalShows: number
        totalEpisodes: number
        totalPlays: number
        uniqueListeners: number
    }
    trends: { date: string; plays: number }[]
    topEpisodes: { id: string; title: string; showTitle: string; showId?: string; plays: number }[]
    topShows: { id: string; title: string; plays: number; episodes: number }[]
    shows: { id: string; title: string }[]
    range: string
}

export default function StatsPage() {
    const { isConnected, subscribe, on } = useSocket()
    const [streams, setStreams] = useState<StreamStatus[]>([])
    const [recordingEvents, setRecordingEvents] = useState<RecordingEvent[]>([])
    const [siteListeners, setSiteListeners] = useState(0)
    const [isMounted, setIsMounted] = useState(false)
    const [timezone, setTimezone] = useState('UTC')
    const [isLoadingStreams, setIsLoadingStreams] = useState(true)
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(true)

    // Engagement Analytics State
    const [engagement, setEngagement] = useState<EngagementData | null>(null)
    const [isLoadingEngagement, setIsLoadingEngagement] = useState(true)
    const [engagementRange, setEngagementRange] = useState('7d')
    const [showFilter, setShowFilter] = useState('')

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

    // Fetch engagement data
    useEffect(() => {
        setIsLoadingEngagement(true)
        const params = new URLSearchParams({ range: engagementRange })
        if (showFilter) params.set('showId', showFilter)

        fetch(`/api/stats/engagement?${params}`)
            .then(res => res.json())
            .then(data => {
                setEngagement(data)
                setIsLoadingEngagement(false)
            })
            .catch(err => {
                console.error('Failed to fetch engagement:', err)
                setIsLoadingEngagement(false)
            })
    }, [engagementRange, showFilter])

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

    // Fetch initial stream data (all streams - disabled ones show as offline)
    useEffect(() => {
        setIsLoadingStreams(true)
        fetch('/api/streams')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setStreams(data.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        // Disabled streams always show as offline
                        status: s.isEnabled ? (s.status || 'unknown') : 'offline',
                        listeners: s.listeners
                    })))
                }
            })
            .catch(err => console.error('Failed to fetch streams:', err))
            .finally(() => setIsLoadingStreams(false))
    }, [])

    // Fetch recent recordings on page load
    useEffect(() => {
        setIsLoadingRecordings(true)
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
            .finally(() => setIsLoadingRecordings(false))
    }, [])

    const onlineStreams = streams.filter(s => s.status === 'online').length

    // Calculate download rate (0% for now as we don't track downloads)
    const downloadRate = 0

    return (
        <div className="h-full flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gray-950 pb-4 pt-6 px-6 flex items-center justify-between gap-4 relative">
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
                {/* Gradient fade extending below header */}
                <div
                    className="absolute left-0 right-0 h-6 pointer-events-none"
                    style={{
                        bottom: '-24px',
                        background: 'linear-gradient(to bottom, rgb(3, 7, 18) 0%, transparent 100%)'
                    }}
                />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6 space-y-6">
                {/* Directory Overview */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Directory Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Shows */}
                        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg">
                                    <BarChart3 className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">
                                        {isLoadingEngagement ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        ) : (
                                            engagement?.overview.totalShows || 0
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-400">Total Shows</div>
                                </div>
                            </div>
                        </div>

                        {/* Total Episodes */}
                        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg">
                                    <Podcast className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">
                                        {isLoadingEngagement ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        ) : (
                                            engagement?.overview.totalEpisodes || 0
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-400">Total Episodes</div>
                                </div>
                            </div>
                        </div>

                        {/* Site Listeners (Live) */}
                        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">
                                        {siteListeners}
                                    </div>
                                    <div className="text-sm text-gray-400">Live Listeners</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement Analytics */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Engagement Analytics
                        </h2>
                        <div className="flex items-center gap-3">
                            {/* Time Range Filter */}
                            <div className="flex bg-gray-900 rounded-lg p-1">
                                {['7d', '30d', '90d', 'all'].map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setEngagementRange(range)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${engagementRange === range
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {range === 'all' ? 'All Time' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                                    </button>
                                ))}
                            </div>
                            {/* Show Filter */}
                            {engagement && engagement.shows.length > 0 && (
                                <select
                                    value={showFilter}
                                    onChange={(e) => setShowFilter(e.target.value)}
                                    className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Shows</option>
                                    {engagement.shows.map(show => (
                                        <option key={show.id} value={show.id}>{show.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Engagement Metrics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {/* Total Plays */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-green-500/20 rounded-lg">
                                    <Play className="w-4 h-4 text-green-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {isLoadingEngagement ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                ) : (
                                    engagement?.overview.totalPlays || 0
                                )}
                            </div>
                            <div className="text-xs text-gray-400">Total Plays</div>
                        </div>

                        {/* Downloads (placeholder) */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                    <Download className="w-4 h-4 text-blue-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">0</div>
                            <div className="text-xs text-gray-400">Downloads</div>
                        </div>

                        {/* Unique Listeners */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                                    <Users className="w-4 h-4 text-purple-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {isLoadingEngagement ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                ) : (
                                    engagement?.overview.uniqueListeners || 0
                                )}
                            </div>
                            <div className="text-xs text-gray-400">Unique Listeners</div>
                        </div>

                        {/* Download Rate */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                                    <BarChart3 className="w-4 h-4 text-yellow-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">{downloadRate}%</div>
                            <div className="text-xs text-gray-400">Download Rate</div>
                        </div>
                    </div>

                    {/* Engagement Trends Chart */}
                    <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Engagement Trends</h3>
                        <EngagementLineChart
                            isLoading={isLoadingEngagement}
                            data={(() => {
                                // Generate full date range based on selected filter
                                const getDaysCount = () => {
                                    switch (engagementRange) {
                                        case '30d': return 30
                                        case '90d': return 90
                                        case 'all': return Math.max(engagement?.trends.length || 7, 7)
                                        default: return 7
                                    }
                                }
                                const daysCount = getDaysCount()
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)

                                // Create a map of existing play data
                                const playsByDate = new Map<string, number>()
                                engagement?.trends.forEach(t => {
                                    playsByDate.set(t.date, t.plays)
                                })

                                // Generate all dates in range
                                const fullRange: { date: string; plays: number; downloads: number; dateObj: Date }[] = []
                                for (let i = daysCount - 1; i >= 0; i--) {
                                    const date = new Date(today)
                                    date.setDate(date.getDate() - i)
                                    const dateStr = date.toISOString().split('T')[0]
                                    fullRange.push({
                                        date: dateStr,
                                        plays: playsByDate.get(dateStr) || 0,
                                        downloads: 0, // No download tracking yet
                                        dateObj: date
                                    })
                                }

                                return fullRange
                            })()}
                        />
                    </div>
                </div>

                {/* Top Episodes & Top Shows */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Episodes */}
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Top Episodes</h2>
                        {isLoadingEngagement ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : engagement && engagement.topEpisodes.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-gray-500 uppercase tracking-wider">
                                            <th className="text-left pb-3 font-medium">#</th>
                                            <th className="text-left pb-3 font-medium">Episode</th>
                                            <th className="text-right pb-3 font-medium">Plays</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {engagement.topEpisodes.map((ep, i) => (
                                            <tr key={ep.id} className="group">
                                                <td className="py-3 text-gray-500 font-mono">{i + 1}</td>
                                                <td className="py-3">
                                                    <div className="font-medium text-white group-hover:text-green-400 transition-colors">
                                                        {ep.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{ep.showTitle}</div>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className="text-green-400 font-bold">{ep.plays}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No episodes played yet.</p>
                        )}
                    </div>

                    {/* Top Shows */}
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Top Shows</h2>
                        {isLoadingEngagement ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : engagement && engagement.topShows.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-gray-500 uppercase tracking-wider">
                                            <th className="text-left pb-3 font-medium">#</th>
                                            <th className="text-left pb-3 font-medium">Show</th>
                                            <th className="text-right pb-3 font-medium">Plays</th>
                                            <th className="text-right pb-3 font-medium">Episodes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {engagement.topShows.map((show, i) => (
                                            <tr key={show.id} className="group">
                                                <td className="py-3 text-gray-500 font-mono">{i + 1}</td>
                                                <td className="py-3">
                                                    <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                                        {show.title}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className="text-green-400 font-bold">{show.plays}</span>
                                                </td>
                                                <td className="py-3 text-right text-gray-400">{show.episodes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No shows played yet.</p>
                        )}
                    </div>
                </div>

                {/* Original Stats Cards */}
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
                                {isLoadingStreams ? (
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : (
                                    <span className="text-green-400">{onlineStreams} / {streams.length}</span>
                                )}
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
                                {isLoadingRecordings ? (
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : (
                                    <span className="text-gray-200">{recordingEvents.length}</span>
                                )}
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
                    {isLoadingRecordings ? (
                        <div className="flex items-center justify-center py-8 gap-3">
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            <span className="text-gray-400">Loading recording events...</span>
                        </div>
                    ) : recordingEvents.length === 0 ? (
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
                    {isLoadingStreams ? (
                        <div className="flex items-center justify-center py-8 gap-3">
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            <span className="text-gray-400">Loading streams...</span>
                        </div>
                    ) : streams.length === 0 ? (
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

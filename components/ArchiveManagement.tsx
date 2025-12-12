'use client'

import { useState, useEffect } from 'react'
import { Archive, Download, Trash2, ChevronDown, ChevronRight, HardDrive, AlertTriangle } from 'lucide-react'
import { getArchivedEpisodes, deleteArchivedEpisode, deleteShowArchives } from '@/app/actions'
import { formatInTimezone } from '@/lib/client-date-utils'

interface ArchivedEpisode {
    id: string
    title: string
    publishedAt: Date | null
    duration: number | null
    fileSize: number
    filePath: string | null | undefined
    recordingId: string | null | undefined
}

interface ShowArchive {
    showId: string
    showTitle: string
    feedLimit: number
    archivedCount: number
    totalSize: number
    episodes: ArchivedEpisode[]
}

interface ArchiveManagementProps {
    timezone: string
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function ArchiveManagement({ timezone }: ArchiveManagementProps) {
    const [archives, setArchives] = useState<ShowArchive[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set())
    const [deleteConfirmShow, setDeleteConfirmShow] = useState<string | null>(null)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadArchives()
    }, [])

    const loadArchives = async () => {
        setLoading(true)
        try {
            const data = await getArchivedEpisodes()
            setArchives(data)
        } catch (e) {
            console.error('Error loading archives:', e)
        }
        setLoading(false)
    }

    const toggleExpand = (showId: string) => {
        const newExpanded = new Set(expandedShows)
        if (newExpanded.has(showId)) {
            newExpanded.delete(showId)
        } else {
            newExpanded.add(showId)
        }
        setExpandedShows(newExpanded)
    }

    const handleDeleteSingle = async (episodeId: string) => {
        if (!confirm('Delete this archived episode? The audio file will be permanently removed.')) return
        try {
            await deleteArchivedEpisode(episodeId)
            await loadArchives()
        } catch (e) {
            console.error('Error deleting episode:', e)
        }
    }

    const handleDeleteAll = async (showId: string) => {
        if (deleteConfirmText !== 'DELETE') return
        setDeleting(true)
        try {
            await deleteShowArchives(showId)
            setDeleteConfirmShow(null)
            setDeleteConfirmText('')
            await loadArchives()
        } catch (e) {
            console.error('Error deleting archives:', e)
        }
        setDeleting(false)
    }

    const handleDownloadSingle = (filePath: string | null | undefined, title: string) => {
        if (!filePath) return
        // Download with metadata embedded in filename
        window.open(`/api/audio/${encodeURIComponent(filePath)}?download=true`, '_blank')
    }

    const handleDownloadAll = (showId: string) => {
        window.open(`/api/archives/download?showId=${showId}`, '_blank')
    }

    const totalArchived = archives.reduce((sum, a) => sum + a.archivedCount, 0)
    const totalSize = archives.reduce((sum, a) => sum + a.totalSize, 0)

    if (loading) {
        return (
            <section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Archive Management
                </h2>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-gray-400">Loading archives...</span>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Archive Management
            </h2>

            {archives.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <HardDrive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No archived episodes found.</p>
                    <p className="text-sm mt-1">Episodes beyond feed limits will appear here when archiving is enabled.</p>
                </div>
            ) : (
                <>
                    {/* Summary */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                        <div className="flex items-center gap-2">
                            <Archive className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-300">{totalArchived} archived episodes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-orange-400" />
                            <span className="text-sm text-gray-300">{formatBytes(totalSize)} total</span>
                        </div>
                    </div>

                    {/* Per-show cards */}
                    <div className="space-y-3">
                        {archives.map(archive => (
                            <div key={archive.showId} className="border border-gray-700 rounded-lg overflow-hidden">
                                {/* Header */}
                                <div
                                    className="flex items-center justify-between p-4 bg-gray-900/30 cursor-pointer hover:bg-gray-900/50 transition-colors"
                                    onClick={() => toggleExpand(archive.showId)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedShows.has(archive.showId)
                                            ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                            : <ChevronRight className="w-4 h-4 text-gray-400" />
                                        }
                                        <span className="font-medium">{archive.showTitle}</span>
                                        <span className="text-sm text-gray-500">
                                            {archive.archivedCount} archived · {formatBytes(archive.totalSize)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleDownloadAll(archive.showId)}
                                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Download All
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmShow(archive.showId)}
                                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete All
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded episode list */}
                                {expandedShows.has(archive.showId) && (
                                    <div className="border-t border-gray-700">
                                        {archive.episodes.map(episode => (
                                            <div key={episode.id} className="flex items-center justify-between p-3 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-900/20">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{episode.title}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {episode.publishedAt && formatInTimezone(new Date(episode.publishedAt), 'MMM d, yyyy', timezone)}
                                                        {' · '}
                                                        {formatBytes(episode.fileSize)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleDownloadSingle(episode.filePath, episode.title)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSingle(episode.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Delete All Confirmation Modal */}
            {deleteConfirmShow && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
                        <div className="flex items-center gap-3 text-red-400 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-semibold">Delete All Archives</h3>
                        </div>
                        <p className="text-gray-300 mb-4">
                            This will permanently delete all archived episodes for this show. Audio files cannot be recovered.
                        </p>
                        <p className="text-sm text-gray-400 mb-3">
                            Type <span className="font-mono text-red-400">DELETE</span> to confirm:
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 mb-4 focus:outline-none focus:border-red-500"
                            placeholder="Type DELETE"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setDeleteConfirmShow(null); setDeleteConfirmText(''); }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteAll(deleteConfirmShow)}
                                disabled={deleteConfirmText !== 'DELETE' || deleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors cursor-pointer"
                            >
                                {deleting ? 'Deleting...' : 'Delete All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

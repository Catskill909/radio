'use client'

import { useState } from 'react'
import { Radio, RefreshCw, Edit, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toggleStream, refreshStream, deleteStream } from '@/app/actions'
import DeleteConfirmModal from './DeleteConfirmModal'
import { formatDistanceToNow } from 'date-fns'

interface StreamCardProps {
    stream: {
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
    onEdit: () => void
}

export default function StreamCard({ stream, onEdit }: StreamCardProps) {
    const [isEnabled, setIsEnabled] = useState(stream.isEnabled)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [showDiagnostics, setShowDiagnostics] = useState(false)

    const handleToggle = async () => {
        const newState = !isEnabled
        setIsEnabled(newState)
        await toggleStream(stream.id, newState)

        // Refresh stream status when enabling
        if (newState) {
            handleRefresh()
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await refreshStream(stream.id)
        setIsRefreshing(false)
        window.location.reload()
    }

    const handleDelete = async () => {
        await deleteStream(stream.id)
        setDeleteModalOpen(false)
        window.location.reload()
    }

    // Determine status indicator
    const getStatusIndicator = () => {
        if (!isEnabled) {
            return <div className="w-4 h-4 rounded-full bg-gray-600" title="Disabled" />
        }

        switch (stream.status) {
            case 'online':
                return <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" title="Online" />
            case 'offline':
            case 'error':
                return <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" title="Offline/Error" />
            case 'testing':
                return <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse" title="Testing" />
            default:
                return <div className="w-4 h-4 rounded-full bg-gray-500" title="Unknown" />
        }
    }

    const getStatusColor = () => {
        if (!isEnabled) return 'text-gray-500'

        switch (stream.status) {
            case 'online':
                return 'text-green-500'
            case 'offline':
            case 'error':
                return 'text-red-500'
            case 'testing':
                return 'text-yellow-500'
            default:
                return 'text-gray-500'
        }
    }

    return (
        <>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                        {getStatusIndicator()}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{stream.name}</h3>
                            <p className="text-sm text-gray-400 font-mono break-all">{stream.url}</p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={handleToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Status and Metadata */}
                <div className="space-y-3 mb-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                        {stream.status === 'online' && isEnabled && (
                            <CheckCircle className={`w-4 h-4 ${getStatusColor()}`} />
                        )}
                        {(stream.status === 'offline' || stream.status === 'error') && isEnabled && (
                            <AlertCircle className={`w-4 h-4 ${getStatusColor()}`} />
                        )}
                        <span className={`text-sm font-medium ${getStatusColor()}`}>
                            {isEnabled ? stream.status.charAt(0).toUpperCase() + stream.status.slice(1) : 'Disabled'}
                        </span>
                    </div>

                    {/* Metadata */}
                    {isEnabled && stream.status === 'online' && (
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                            {stream.format && (
                                <span className="bg-gray-700 px-2 py-1 rounded">{stream.format}</span>
                            )}
                            {stream.bitrate && (
                                <span className="bg-gray-700 px-2 py-1 rounded">{stream.bitrate} kbps</span>
                            )}
                            {stream.listeners !== null && stream.listeners !== undefined && (
                                <span className="bg-gray-700 px-2 py-1 rounded">
                                    {stream.listeners} {stream.maxListeners ? `/ ${stream.maxListeners}` : ''} listeners
                                </span>
                            )}
                            {stream.genre && (
                                <span className="bg-gray-700 px-2 py-1 rounded">{stream.genre}</span>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {isEnabled && stream.errorMessage && (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-400">{stream.errorMessage}</p>
                        </div>
                    )}

                    {/* Last Checked */}
                    {stream.lastChecked && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Last checked {formatDistanceToNow(new Date(stream.lastChecked), { addSuffix: true })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </button>
                    <button
                        onClick={() => setDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Stream"
                message={`Are you sure you want to delete "${stream.name}"? This action cannot be undone.`}
            />
        </>
    )
}

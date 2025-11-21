'use client'

import { useState } from 'react'
import { Radio, RefreshCw, Edit, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toggleStream, refreshStream, deleteStream } from '@/app/actions'
import DeleteConfirmModal from './DeleteConfirmModal'
import { formatDistanceToNow } from 'date-fns'
import { Tooltip } from './Tooltip'

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
            return (
                <Tooltip content="Disabled">
                    <div className="w-4 h-4 rounded-full bg-gray-600" />
                </Tooltip>
            )
        }

        switch (stream.status) {
            case 'online':
                return (
                    <Tooltip content="Online">
                        <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                    </Tooltip>
                )
            case 'offline':
            case 'error':
                return (
                    <Tooltip content="Offline/Error">
                        <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                    </Tooltip>
                )
            case 'testing':
                return (
                    <Tooltip content="Testing">
                        <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse" />
                    </Tooltip>
                )
            default:
                return (
                    <Tooltip content="Unknown">
                        <div className="w-4 h-4 rounded-full bg-gray-500" />
                    </Tooltip>
                )
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
                    {/* Status Line */}
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

                        {/* Last Checked - Inline with status */}
                        {stream.lastChecked && (
                            <span className="text-xs text-gray-500 border-l border-gray-700 pl-2 ml-1">
                                Checked {formatDistanceToNow(new Date(stream.lastChecked), { addSuffix: true })}
                            </span>
                        )}
                    </div>

                    {/* Stream Details - Always visible if data exists */}
                    <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs text-gray-400 bg-gray-900/30 p-3 rounded-lg">
                        {(stream.format || stream.bitrate) && (
                            <div className="col-span-2 sm:col-span-1">
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Quality</span>
                                <span className="font-mono text-gray-300">
                                    {stream.bitrate ? `${stream.bitrate}kbps` : ''}
                                    {stream.bitrate && stream.format ? ' • ' : ''}
                                    {stream.format}
                                </span>
                            </div>
                        )}

                        {stream.genre && (
                            <div className="col-span-2 sm:col-span-1">
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Genre</span>
                                <span className="text-gray-300">{stream.genre}</span>
                            </div>
                        )}

                        {/* Listeners - Only relevant when online/testing */}
                        {(stream.status === 'online' || stream.status === 'testing') && stream.listeners !== null && stream.listeners !== undefined && (
                            <div className="col-span-2 sm:col-span-1">
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Listeners</span>
                                <span className="text-gray-300">
                                    {stream.listeners} {stream.maxListeners ? `/ ${stream.maxListeners}` : ''}
                                </span>
                            </div>
                        )}

                        {stream.description && (
                            <div className="col-span-2 mt-1 pt-1 border-t border-gray-800/50">
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Description</span>
                                <p className="text-gray-300 line-clamp-2">{stream.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {isEnabled && stream.errorMessage && (
                        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-2.5 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-300">{stream.errorMessage}</p>
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

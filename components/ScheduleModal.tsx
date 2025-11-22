'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createScheduleSlot, createShow } from '@/app/actions'

interface Show {
    id: string
    title: string
    type: string
    description?: string | null
    image?: string | null
    host?: string | null
    email?: string | null
    author?: string | null
    explicit?: boolean
    category?: string | null
    tags?: string | null
    recordingEnabled?: boolean
    recordingSource?: string | null
    language?: string
    copyright?: string | null
    link?: string | null
    createdAt: Date
    updatedAt: Date
}

interface ScheduleModalProps {
    isOpen: boolean
    onClose: () => void
    selectedSlot: { start: Date; end: Date } | null
    shows: Show[]
}

export default function ScheduleModal({
    isOpen,
    onClose,
    selectedSlot,
    shows,
}: ScheduleModalProps) {
    const [activeTab, setActiveTab] = useState<'select' | 'create'>('select')
    const [selectedShowId, setSelectedShowId] = useState('')
    const [duration, setDuration] = useState(60)
    const [isRecurring, setIsRecurring] = useState(false)

    // New show fields
    const [newShowTitle, setNewShowTitle] = useState('')
    const [newShowHost, setNewShowHost] = useState('')
    const [newShowType, setNewShowType] = useState('Local Podcast')

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    const handleScheduleExisting = async () => {
        if (!selectedShowId || !selectedSlot) return

        const endTime = new Date(selectedSlot.start)
        endTime.setMinutes(endTime.getMinutes() + duration)

        await createScheduleSlot(selectedShowId, selectedSlot.start, endTime, undefined, isRecurring)
        onClose()
        window.location.reload() // Refresh to show new slot
    }

    const handleCreateAndSchedule = async () => {
        if (!newShowTitle || !selectedSlot) return

        const formData = new FormData()
        formData.set('title', newShowTitle)
        formData.set('host', newShowHost)
        formData.set('type', newShowType)
        formData.set('description', '')
        formData.set('image', '')
        formData.set('startDate', selectedSlot.start.toISOString().split('T')[0])
        formData.set('startTime', selectedSlot.start.toTimeString().split(' ')[0].substring(0, 5))
        formData.set('duration', duration.toString())
        formData.set('isRecurring', isRecurring.toString())
        formData.set('recordingEnabled', 'false')
        formData.set('recordingSource', '')

        await createShow(formData)
        onClose()
        window.location.reload()
    }

    if (!isOpen || !selectedSlot) return null

    const formatSlotTime = (date: Date) => {
        return date.toLocaleString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-white">Schedule Show</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('select')}
                        className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'select'
                            ? 'text-blue-500 border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Select Existing Show
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'create'
                            ? 'text-blue-500 border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Create New Show
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Time Slot Info */}
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-400">Time Slot</p>
                        <p className="text-lg font-medium text-white">{formatSlotTime(selectedSlot.start)}</p>
                    </div>

                    {/* Select Existing Tab */}
                    {activeTab === 'select' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Select Show
                                </label>
                                <select
                                    value={selectedShowId}
                                    onChange={(e) => setSelectedShowId(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-200"
                                >
                                    <option value="">Choose a show...</option>
                                    {shows.map((show) => (
                                        <option key={show.id} value={show.id}>
                                            {show.title}{show.host ? ` - ${show.host}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        min="15"
                                        step="15"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2 flex items-end">
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors w-full">
                                        <input
                                            type="checkbox"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded border-gray-700 bg-gray-900 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-300 font-medium">Repeat Weekly</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleScheduleExisting}
                                disabled={!selectedShowId}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors shadow-lg hover:shadow-blue-500/20"
                            >
                                Schedule Show
                            </button>
                        </div>
                    )}

                    {/* Create New Tab */}
                    {activeTab === 'create' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Show Title
                                </label>
                                <input
                                    type="text"
                                    value={newShowTitle}
                                    onChange={(e) => setNewShowTitle(e.target.value)}
                                    placeholder="e.g. Morning Jazz"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Host
                                </label>
                                <input
                                    type="text"
                                    value={newShowHost}
                                    onChange={(e) => setNewShowHost(e.target.value)}
                                    placeholder="e.g. John Smith"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Show Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Local Podcast', 'Syndicated Podcast', 'Local Music', 'Syndicated Music'].map((type) => (
                                        <label
                                            key={type}
                                            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${newShowType === type
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="newShowType"
                                                value={type}
                                                checked={newShowType === type}
                                                onChange={(e) => setNewShowType(e.target.value)}
                                                className="text-blue-600 focus:ring-blue-500 bg-gray-800 border-gray-600 w-4 h-4"
                                            />
                                            <span className="text-sm">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        min="15"
                                        step="15"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2 flex items-end">
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors w-full">
                                        <input
                                            type="checkbox"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded border-gray-700 bg-gray-900 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-300 font-medium">Repeat Weekly</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateAndSchedule}
                                disabled={!newShowTitle}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors shadow-lg hover:shadow-blue-500/20"
                            >
                                Create & Schedule Show
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

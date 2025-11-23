'use client'

import { X, Clock, Calendar, Repeat, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { updateScheduleSlot, deleteScheduleSlot, updateShow } from '@/app/actions'
import DateTimePicker from '@/components/DateTimePicker'
import DeleteSlotOptions from '@/components/DeleteSlotOptions'
import EditShowForm from '@/components/EditShowForm'
import { Tooltip } from './Tooltip'

interface Show {
    id: string
    title: string
    description: string | null
    type: string
    image: string | null
    host: string | null
    email: string | null
    author: string | null
    explicit: boolean
    category: string | null
    tags: string | null
    recordingEnabled: boolean
    recordingSource: string | null
    language: string
    copyright: string | null
    link: string | null
    createdAt: Date
    updatedAt: Date
}

interface ScheduleSlot {
    id: string
    showId: string
    show: Show
    startTime: Date
    endTime: Date
    isRecurring: boolean
    splitGroupId: string | null
    splitPosition: string | null
}

interface EditSlotModalProps {
    isOpen: boolean
    onClose: () => void
    slot: ScheduleSlot | null
    streams: { id: string; name: string; url: string }[]
}

export default function EditSlotModal({ isOpen, onClose, slot, streams }: EditSlotModalProps) {
    const router = useRouter()
    const [startTime, setStartTime] = useState<Date>(new Date())
    const [duration, setDuration] = useState(60)
    const [isRecurring, setIsRecurring] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteOptions, setShowDeleteOptions] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (slot) {
            setStartTime(new Date(slot.startTime))
            const durationMins = Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000)
            setDuration(durationMins)
            setIsRecurring(slot.isRecurring)
            setError(null)
        }
    }, [slot])

    if (!isOpen || !slot) return null

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        try {
            const endTime = new Date(startTime.getTime() + duration * 60000)
            await updateScheduleSlot(slot.id, startTime, endTime, isRecurring)
            // Force hard reload to bypass browser cache
            window.location.href = window.location.href
        } catch (err: any) {
            setError(err.message)
            setIsSaving(false)
        }
    }

    const handleDelete = async (mode: 'single' | 'this-and-future', deleteBothParts: boolean) => {
        setIsDeleting(true)
        setError(null)
        try {
            await deleteScheduleSlot(slot.id, { deleteMode: mode, deleteBothParts })
            onClose()
            window.location.reload()
        } catch (err: any) {
            setError(err.message)
            setIsDeleting(false)
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between z-10">
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>
                            Edit Schedule Slot
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-8">
                        {/* Top Section: Slot Settings */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-800">
                            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                Slot Settings
                            </h3>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Start Time */}
                                <div>
                                    <DateTimePicker
                                        label="Start Time"
                                        selected={startTime}
                                        onChange={(date) => date && setStartTime(date)}
                                        showTimeSelect={true}
                                    />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        min="15"
                                        step="15"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Recurring */}
                                <div className="flex items-center h-full pt-6">
                                    <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 w-full">
                                        <input
                                            type="checkbox"
                                            id="recurring"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                        />
                                        <label htmlFor="recurring" className="text-sm font-medium text-gray-300 cursor-pointer select-none flex-1">
                                            Repeat Weekly
                                        </label>
                                        <Repeat className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Slot Actions */}
                            <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-700/50">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Delete Section */}
                        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 flex justify-center">
                            {showDeleteOptions ? (
                                <DeleteSlotOptions
                                    slot={{
                                        id: slot.id,
                                        isRecurring: slot.isRecurring,
                                        splitGroupId: slot.splitGroupId,
                                        splitPosition: slot.splitPosition,
                                        startTime: slot.startTime
                                    }}
                                    showTitle={slot.show.title}
                                    onDelete={handleDelete}
                                    onCancel={() => setShowDeleteOptions(false)}
                                />
                            ) : (
                                <button
                                    onClick={() => setShowDeleteOptions(true)}
                                    disabled={isDeleting}
                                    className="flex items-center justify-center gap-2 px-6 py-2 bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-800/50 rounded-md transition-colors disabled:opacity-50 text-sm"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Slot
                                </button>
                            )}

                            {error && (
                                <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-xs">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Bottom Section: Show Settings */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-white border-b border-gray-800 pb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                Show Settings
                            </h3>
                            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                                <EditShowForm show={slot.show} streams={streams} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

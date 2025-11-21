'use client'

import { X, Trash2, Calendar as CalendarIcon, Clock, Repeat } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { updateScheduleSlot, deleteScheduleSlot } from '@/app/actions'
import DateTimePicker from './DateTimePicker'
import DeleteConfirmModal from './DeleteConfirmModal'
import EditShowForm from './EditShowForm'
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
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

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

    const handleDelete = async () => {
        await deleteScheduleSlot(slot.id)
        setDeleteModalOpen(false)
        onClose()
        // Force full page reload
        window.location.reload()
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
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Slot Settings */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-white border-b border-gray-800 pb-2">Slot Settings</h3>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

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
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="recurring" className="text-sm font-medium text-gray-300">
                                    Repeat Weekly
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-800 mt-8">
                                <Tooltip content="Delete Slot">
                                    <button
                                        onClick={() => setDeleteModalOpen(true)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg hover:shadow-red-500/20"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </Tooltip>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Saving...' : 'Save Slot Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Show Settings */}
                        <div className="space-y-6 border-l border-gray-800 pl-8">
                            <h3 className="text-xl font-semibold text-white border-b border-gray-800 pb-2">Show Settings</h3>
                            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                                <EditShowForm show={slot.show} streams={streams} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Schedule Slot"
                message={`Are you sure you want to delete this schedule slot for "${slot.show.title}"? This action cannot be undone.`}
            />
        </>
    )
}

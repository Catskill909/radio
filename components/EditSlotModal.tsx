'use client'

import { X, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { updateScheduleSlot, deleteScheduleSlot } from '@/app/actions'
import DateTimePicker from './DateTimePicker'
import DeleteConfirmModal from './DeleteConfirmModal'

interface Show {
    id: string
    title: string
    type: string
    host?: string | null
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
}

export default function EditSlotModal({ isOpen, onClose, slot }: EditSlotModalProps) {
    const [startTime, setStartTime] = useState<Date>(new Date())
    const [duration, setDuration] = useState(60)
    const [isRecurring, setIsRecurring] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)

    useEffect(() => {
        if (slot) {
            setStartTime(new Date(slot.startTime))
            const durationMins = Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000)
            setDuration(durationMins)
            setIsRecurring(slot.isRecurring)
        }
    }, [slot])

    if (!isOpen || !slot) return null

    const handleSave = async () => {
        const endTime = new Date(startTime.getTime() + duration * 60000)

        await updateScheduleSlot(slot.id, startTime, endTime, isRecurring)
        window.location.reload()
    }

    const handleDelete = async () => {
        await deleteScheduleSlot(slot.id)
        setDeleteModalOpen(false)
        onClose()
        window.location.reload()
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    <div className="p-6 space-y-6">
                        {/* Show Info (Read-only) */}
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-400 mb-2">Show Details</h3>
                            <div className="space-y-1">
                                <p className="text-lg font-semibold">{slot.show.title}</p>
                                {slot.show.host && (
                                    <p className="text-sm text-gray-400">Host: {slot.show.host}</p>
                                )}
                                <p className="text-sm text-gray-400">Type: {slot.show.type}</p>
                            </div>
                        </div>

                        {/* Start Time */}
                        <div>
                            <DateTimePicker
                                label="Start Time"
                                selected={startTime}
                                onChange={(date) => date && setStartTime(date)}
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
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Slot
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Save Changes
                            </button>
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

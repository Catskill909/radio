'use client'

import { X, Clock, Calendar, Repeat, Trash2, AlertCircle, Radio } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { updateScheduleSlot, deleteScheduleSlot, updateShowRecordingSource, updateSlotRecording } from '@/app/actions'
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
    itunesType: string
    tags: string | null
    recordingEnabled: boolean
    recordingSource: string | null
    language: string
    copyright: string | null
    link: string | null
    feedEpisodeLimit: number | null
    archivingEnabled: boolean
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
    recordingOverride: boolean | null
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

    // Recording state
    const [recordingEnabled, setRecordingEnabled] = useState(false)
    const [recordingSource, setRecordingSource] = useState<string>('')
    const [recordingScope, setRecordingScope] = useState<'single' | 'this-and-future'>('single')
    const [recordingChanged, setRecordingChanged] = useState(false)
    const [isSavingRecording, setIsSavingRecording] = useState(false)
    const [showSourceRequiredModal, setShowSourceRequiredModal] = useState(false)
    const scopeSelectorRef = useRef<HTMLDivElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    const getEffectiveRecording = (s: ScheduleSlot) => {
        return s.recordingOverride !== null ? s.recordingOverride : s.show.recordingEnabled
    }

    useEffect(() => {
        if (slot) {
            setStartTime(new Date(slot.startTime))
            const durationMins = Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000)
            setDuration(durationMins)
            setIsRecurring(slot.isRecurring)
            setRecordingEnabled(getEffectiveRecording(slot))
            setRecordingSource(slot.show.recordingSource || '')
            setRecordingChanged(false)
            setRecordingScope('single')
            setError(null)
        }
    }, [slot])

    if (!isOpen || !slot) return null

    const isRecordingOverridden = slot.recordingOverride !== null

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        try {
            const endTime = new Date(startTime.getTime() + duration * 60000)
            await updateScheduleSlot(slot.id, startTime, endTime, isRecurring)
            window.location.href = window.location.href
        } catch (err: any) {
            setError(err.message)
            setIsSaving(false)
        }
    }

    const handleRecordingChange = (enabled: boolean) => {
        setRecordingEnabled(enabled)
        setRecordingChanged(true)
        // Auto-scroll modal to show scope options after brief delay for render
        setTimeout(() => {
            if (modalRef.current) {
                modalRef.current.scrollBy({ top: 200, behavior: 'smooth' })
            }
        }, 150)
    }

    const handleSaveRecording = async () => {
        // Validate: if recording is enabled, a source must be selected
        if (recordingEnabled && !recordingSource) {
            setShowSourceRequiredModal(true)
            return
        }

        setIsSavingRecording(true)
        setError(null)
        try {
            // If source changed, update the show's recording source (but NOT recordingEnabled)
            if (recordingSource !== (slot.show.recordingSource || '')) {
                await updateShowRecordingSource(slot.show.id, recordingSource)
            }
            await updateSlotRecording(slot.id, recordingEnabled, recordingScope)
            window.location.href = window.location.href
        } catch (err: any) {
            setError(err.message)
            setIsSavingRecording(false)
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
            {/* Source Required Modal */}
            {showSourceRequiredModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/30 px-6 py-5 border-b border-gray-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Recording Source Required</h3>
                                    <p className="text-sm text-gray-400 mt-0.5">Please configure your recording settings</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                To enable recording for this broadcast, you need to select a stream source.
                                Without a source, the system won't know which audio stream to capture.
                            </p>
                            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                                <p className="text-xs text-gray-400">
                                    <span className="text-gray-300 font-medium">Tip:</span> Select an Icecast stream from the "Recording Source" dropdown to specify which audio feed should be recorded.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700/50 flex justify-end">
                            <button
                                onClick={() => setShowSourceRequiredModal(false)}
                                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                            >
                                Got it, I'll select a source
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1050] flex items-center justify-center p-4">
                <div ref={modalRef} className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between z-10">
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>
                            Edit Schedule Slot
                            <span className="text-gray-400 font-normal ml-2">— {slot.show.title}</span>
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
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-red-300 text-sm font-medium mb-1">Unable to Save Changes</p>
                                            <p className="text-red-400/90 text-sm leading-relaxed">{error}</p>
                                            <div className="mt-3 pt-3 border-t border-red-500/20">
                                                <p className="text-xs text-red-400/70 font-medium mb-1.5">What can you do?</p>
                                                <ul className="space-y-1 text-xs text-red-400/70">
                                                    <li className="flex items-start gap-1.5">
                                                        <span className="text-red-400 mt-0.5">•</span>
                                                        <span>Choose a different time slot</span>
                                                    </li>
                                                    <li className="flex items-start gap-1.5">
                                                        <span className="text-red-400 mt-0.5">•</span>
                                                        <span>Adjust the duration to avoid conflicts</span>
                                                    </li>
                                                    <li className="flex items-start gap-1.5">
                                                        <span className="text-red-400 mt-0.5">•</span>
                                                        <span>Uncheck "Repeat Weekly" if scheduling recurring shows</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {slot.isRecurring && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
                                    <div className="flex items-start gap-2">
                                        <Repeat className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-blue-300 text-sm">
                                            <strong>Recurring Show:</strong> Changes will apply to this instance and all future instances. Past shows remain unchanged.
                                        </p>
                                    </div>
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
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setDuration(val === '' ? '' as any : parseInt(val));
                                        }}
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
                                    {isSaving ? 'Saving...' : 'Save Time Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Recording Section */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-800">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Radio className="w-5 h-5 text-red-400" />
                                Recording
                            </h3>

                            {/* Current Status */}
                            <div className={`rounded-lg p-4 mb-4 border ${recordingEnabled ? 'bg-red-900/20 border-red-800/50' : 'bg-gray-900/50 border-gray-700'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {recordingEnabled ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                            <span className="text-sm font-medium text-red-300">Will Record</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                            <span className="text-sm font-medium text-gray-400">Will Not Record</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400">
                                    {slot.isRecurring && recordingChanged
                                        ? (recordingScope === 'single'
                                            ? (recordingEnabled
                                                ? `Only ${format(new Date(slot.startTime), 'MMM d, yyyy')} will record`
                                                : `Only ${format(new Date(slot.startTime), 'MMM d, yyyy')} will NOT record`)
                                            : (recordingEnabled
                                                ? `This and all future ${format(new Date(slot.startTime), 'EEEE')} broadcasts will record`
                                                : `This and all future ${format(new Date(slot.startTime), 'EEEE')} broadcasts will NOT record`))
                                        : slot.isRecurring
                                            ? (recordingEnabled
                                                ? `This and all future ${format(new Date(slot.startTime), 'EEEE')} broadcasts will record`
                                                : `This and all future ${format(new Date(slot.startTime), 'EEEE')} broadcasts will NOT record`)
                                            : (recordingEnabled
                                                ? `This broadcast will be recorded`
                                                : `This broadcast will not be recorded`)
                                    }
                                </p>
                            </div>

                            {/* Recording Toggle */}
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium text-gray-300">
                                    {recordingEnabled ? 'Turn off recording' : 'Turn on recording'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRecordingChange(!recordingEnabled)}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${recordingEnabled ? 'bg-red-600' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${recordingEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Recording Source Dropdown - only when recording is enabled */}
                            {recordingEnabled && (
                                <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label htmlFor="slotRecordingSource" className="block text-sm font-medium text-gray-300">
                                        Recording Source
                                    </label>
                                    <select
                                        id="slotRecordingSource"
                                        value={recordingSource}
                                        onChange={(e) => {
                                            setRecordingSource(e.target.value)
                                            setRecordingChanged(true)
                                        }}
                                        className={`w-full bg-gray-800 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-gray-200 ${!recordingSource ? 'border-red-500' : 'border-gray-700'
                                            }`}
                                    >
                                        <option value="">Select a source...</option>
                                        {streams.map((stream) => (
                                            <option key={stream.id} value={stream.url}>
                                                {stream.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500">
                                        Select an Icecast stream to record from.
                                    </p>

                                    {/* Warning when no source selected */}
                                    {!recordingSource && (
                                        <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg animate-in fade-in duration-200">
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-red-300 font-medium">No recording source selected</p>
                                                <p className="text-xs text-red-400/80 mt-0.5">Recording will not work until you select a stream source above.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Scope selector - only for recurring slots when changed */}
                            {recordingChanged && slot.isRecurring && (
                                <div ref={scopeSelectorRef} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 mt-4">
                                    <p className="text-sm font-medium text-gray-300 mb-3">Apply this change to:</p>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="recordingScope"
                                                checked={recordingScope === 'single'}
                                                onChange={() => setRecordingScope('single')}
                                                className="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-300">
                                                Only {format(new Date(slot.startTime), 'MMM d, yyyy')}
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="recordingScope"
                                                checked={recordingScope === 'this-and-future'}
                                                onChange={() => setRecordingScope('this-and-future')}
                                                className="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-300">
                                                All future {format(new Date(slot.startTime), 'EEEE')} broadcasts
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Save Recording button */}
                            {recordingChanged && (
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveRecording}
                                        disabled={isSavingRecording}
                                        className="px-4 py-2 bg-red-600/80 hover:bg-red-600 disabled:bg-red-800/50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                                    >
                                        {isSavingRecording ? 'Saving...' : 'Save Recording Settings'}
                                    </button>
                                </div>
                            )}
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
                                <EditShowForm show={slot.show} streams={streams} hideRecordingControls={true} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

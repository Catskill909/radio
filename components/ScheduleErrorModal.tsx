'use client'

import { X, AlertCircle, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { parseScheduleError, getErrorSuggestions, type ParsedScheduleError } from '@/lib/schedule-errors'

interface ScheduleErrorModalProps {
    isOpen: boolean
    onClose: () => void
    errorMessage: string
}

export default function ScheduleErrorModal({ isOpen, onClose, errorMessage }: ScheduleErrorModalProps) {
    if (!isOpen) return null

    const parsedError: ParsedScheduleError = parseScheduleError(errorMessage)
    const suggestions = getErrorSuggestions(parsedError)

    const getErrorTitle = () => {
        if (parsedError.type === 'overlap') {
            return 'Schedule Conflict Detected'
        } else if (parsedError.type === 'validation') {
            return 'Invalid Schedule Settings'
        }
        return 'Unable to Schedule Show'
    }

    const getErrorIcon = () => {
        if (parsedError.type === 'overlap') {
            return <Calendar className="w-6 h-6 text-red-400" />
        }
        return <AlertCircle className="w-6 h-6 text-red-400" />
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gray-900 border border-red-800/50 rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start gap-4 p-6 border-b border-gray-800">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        {getErrorIcon()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-1">{getErrorTitle()}</h2>
                        <p className="text-sm text-gray-400">
                            {parsedError.weekNumber
                                ? `Issue detected in week ${parsedError.weekNumber}`
                                : 'Please review the details below'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Error Message */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-300 text-sm leading-relaxed">
                            {parsedError.message}
                        </p>
                    </div>

                    {/* Conflicting Show Details */}
                    {parsedError.conflictingShow && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-gray-300 font-medium">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span>Conflicting Show</span>
                            </div>
                            <div className="pl-6 space-y-1">
                                <p className="text-white font-semibold">
                                    {parsedError.conflictingShow.title}
                                </p>
                                {parsedError.conflictingShow.startTime && parsedError.conflictingShow.endTime && (
                                    <p className="text-sm text-gray-400">
                                        {format(parsedError.conflictingShow.startTime, 'PPp')} - {format(parsedError.conflictingShow.endTime, 'p')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Suggestions */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-300">What can you do?</h3>
                        <ul className="space-y-1.5">
                            {suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                                    <span className="text-blue-400 mt-0.5">•</span>
                                    <span>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    )
}

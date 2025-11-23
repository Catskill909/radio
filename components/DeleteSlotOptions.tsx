'use client'

import { useState } from 'react'
import { Trash2, AlertCircle } from 'lucide-react'

interface DeleteSlotOptionsProps {
    slot: {
        id: string
        isRecurring: boolean
        splitGroupId: string | null
        splitPosition: string | null
        startTime: Date
    }
    showTitle: string
    onDelete: (mode: 'single' | 'this-and-future', deleteBothParts: boolean) => void
    onCancel: () => void
}

export default function DeleteSlotOptions({
    slot,
    showTitle,
    onDelete,
    onCancel
}: DeleteSlotOptionsProps) {
    const [selectedMode, setSelectedMode] = useState<'single' | 'this-and-future'>('single');
    const isSplit = slot.splitGroupId !== null;
    const futureCount = slot.isRecurring ? "~52" : "1";

    return (
        <div className="space-y-3">
            {/* Warning Badge */}
            {(isSplit || slot.isRecurring) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500/90 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200/80 space-y-0.5">
                        {isSplit && <p>⚡ Midnight-crossing show (both parts will be deleted)</p>}
                        {slot.isRecurring && <p>🔄 Recurring weekly show</p>}
                    </div>
                </div>
            )}

            {/* Delete Options */}
            <div className="space-y-2">
                {slot.isRecurring ? (
                    <>
                        <label className="flex items-start gap-2.5 p-2.5 border border-gray-700/50 rounded-md hover:bg-gray-800/30 cursor-pointer transition-colors group">
                            <input
                                type="radio"
                                name="deleteMode"
                                value="single"
                                checked={selectedMode === 'single'}
                                onChange={() => setSelectedMode('single')}
                                className="mt-0.5 w-4 h-4 accent-gray-500"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                    Delete This Instance Only
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {new Date(slot.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {isSplit && ' (both parts)'}
                                </div>
                            </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-2.5 border border-red-900/30 bg-red-950/20 rounded-md hover:bg-red-950/30 cursor-pointer transition-colors group">
                            <input
                                type="radio"
                                name="deleteMode"
                                value="this-and-future"
                                checked={selectedMode === 'this-and-future'}
                                onChange={() => setSelectedMode('this-and-future')}
                                className="mt-0.5 w-4 h-4 accent-red-500"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">
                                    Delete This & All Future
                                </div>
                                <div className="text-xs text-red-400/60 mt-0.5">
                                    Removes {futureCount} occurrences{isSplit && ' (all parts)'}
                                </div>
                            </div>
                        </label>
                    </>
                ) : (
                    <div className="p-2.5 border border-gray-700/50 rounded-md bg-gray-800/20">
                        <div className="text-sm font-medium text-gray-200">Delete This Show</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                            {isSplit ? 'Both parts will be removed' : 'Show will be removed from schedule'}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-700/50 hover:bg-gray-800/50 transition-colors text-gray-300"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onDelete(selectedMode, isSplit)}
                    className="px-3 py-1.5 text-sm bg-red-900/40 hover:bg-red-900/60 border border-red-900/50 rounded-md flex items-center gap-1.5 transition-colors text-red-300"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </div>
        </div>
    );
}

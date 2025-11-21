'use client'

import { useState, useCallback, useRef } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { DndProvider, useDrag } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { createScheduleSlot, deleteScheduleSlot, getShow } from '@/app/actions'
import { Repeat } from 'lucide-react'
import EditShowModal from '@/components/EditShowModal'
import EditShowForm from '@/components/EditShowForm'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

const DnDCalendar = withDragAndDrop(Calendar)

interface Show {
    id: string
    title: string
    type: string
    image?: string | null
}

interface Slot {
    id: string
    showId: string
    show: Show
    startTime: Date
    endTime: Date
    isRecurring: boolean
}

interface SchedulerProps {
    shows: Show[]
    initialSlots: Slot[]
}

const DraggableShow = ({ show, onDragStart }: { show: Show, onDragStart: (id: string) => void }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'SHOW',
        item: { id: show.id, title: show.title },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }))

    return (
        <div
            ref={(node) => {
                drag(node);
            }}
            onDragStart={() => onDragStart(show.id)}
            className={`p-3 bg-gray-700 rounded cursor-move hover:bg-gray-600 transition-colors flex items-center gap-3 ${isDragging ? 'opacity-50' : 'opacity-100'
                }`}
        >
            {show.image && (
                <img src={show.image} alt={show.title} className="w-8 h-8 rounded object-cover" />
            )}
            <div>
                <div className="font-medium text-sm">{show.title}</div>
                <div className="text-xs text-gray-400">{show.type}</div>
            </div>
        </div>
    )
}

export default function Scheduler({ shows, initialSlots }: SchedulerProps) {
    const [events, setEvents] = useState(
        initialSlots.map((slot) => ({
            id: slot.id,
            title: slot.show.title,
            start: new Date(slot.startTime),
            end: new Date(slot.endTime),
            resourceId: slot.showId,
            isRecurring: slot.isRecurring,
        }))
    )

    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedShow, setSelectedShow] = useState<any>(null)

    const draggedShowIdRef = useRef<string | null>(null);

    const onEventDrop = useCallback(
        async ({ event, start, end }: any) => {
            // Handle moving existing events
            // For now, we just log, but ideally update DB
            console.log('Moved', event, start, end)
        },
        []
    )

    const handleDropFromOutside = useCallback(
        async ({ start, end }: { start: Date; end: Date }) => {
            const showId = draggedShowIdRef.current;
            if (showId) {
                const show = shows.find((s) => s.id === showId)
                if (show) {
                    // Ask for recurrence
                    const isRecurring = window.confirm(`Schedule "${show.title}" as a recurring weekly show?`);

                    // Optimistic update
                    const newEvent = {
                        id: 'temp-' + Date.now(),
                        title: show.title,
                        start,
                        end,
                        resourceId: show.id,
                        isRecurring,
                    }
                    setEvents((prev) => [...prev, newEvent])

                    // Server action
                    await createScheduleSlot(show.id, start, end, undefined, isRecurring)
                }
                draggedShowIdRef.current = null;
            }
        },
        [shows]
    )

    const handleEventClick = async (event: any) => {
        // Fetch the full show data
        const show = await getShow(event.resourceId)
        if (show) {
            setSelectedShow(show)
            setEditModalOpen(true)
        }
    }

    const eventPropGetter = (event: any) => {
        return {
            className: `${event.isRecurring ? 'border-l-4 border-yellow-500' : ''} bg-blue-600 border-none rounded opacity-90 hover:opacity-100 text-sm`,
            style: {
                backgroundColor: '#2563eb',
            }
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-full gap-6">
                {/* Sidebar for Draggables */}
                <div className="w-64 flex-shrink-0 bg-gray-800 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto h-[calc(100vh-120px)]">
                    <h2 className="font-bold text-lg text-gray-300">Shows</h2>
                    <div className="space-y-2">
                        {shows.map((show) => (
                            <DraggableShow
                                key={show.id}
                                show={show}
                                onDragStart={(id) => { draggedShowIdRef.current = id; }}
                            />
                        ))}
                    </div>
                    <div className="mt-auto text-sm text-gray-500">
                        Drag shows onto the calendar.
                    </div>
                </div>

                {/* Calendar */}
                <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800 h-[calc(100vh-120px)]">
                    <DnDCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor={(event: any) => new Date(event.start)}
                        endAccessor={(event: any) => new Date(event.end)}
                        defaultView={Views.WEEK}
                        views={[Views.WEEK, Views.DAY]}
                        step={60}
                        timeslots={1}
                        selectable
                        resizable
                        onEventDrop={onEventDrop}
                        onDropFromOutside={handleDropFromOutside as any}
                        onSelectEvent={handleEventClick}
                        eventPropGetter={eventPropGetter}
                        className="text-gray-300 h-full"
                        components={{
                            event: ({ event }: any) => (
                                <div className="flex items-center gap-1 h-full">
                                    {event.isRecurring && <Repeat className="w-3 h-3" />}
                                    <span className="truncate">{event.title}</span>
                                </div>
                            )
                        }}
                    />
                </div>
            </div>

            {/* Edit Modal */}
            <EditShowModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false)
                    setSelectedShow(null)
                }}
                title="Edit Show"
            >
                {selectedShow && <EditShowForm show={selectedShow} />}
            </EditShowModal>
        </DndProvider>
    )
}

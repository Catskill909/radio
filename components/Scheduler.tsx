'use client'

import { useState, useCallback, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Repeat } from 'lucide-react'
import EditSlotModal from '@/components/EditSlotModal'
import ScheduleModal from '@/components/ScheduleModal'

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

interface Show {
    id: string
    title: string
    type: string
    description: string | null
    image: string | null
    host: string | null
    recordingEnabled: boolean
    recordingSource: string | null
    createdAt: Date
    updatedAt: Date
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
    streams: { id: string; name: string; url: string }[]
}

export default function Scheduler({ shows, initialSlots, streams }: SchedulerProps) {
    const [slots, setSlots] = useState(initialSlots)
    const [events, setEvents] = useState(
        initialSlots.map((slot) => ({
            id: slot.id,
            title: slot.show.title,
            start: new Date(slot.startTime),
            end: new Date(slot.endTime),
            resourceId: slot.showId,
            isRecurring: slot.isRecurring,
            type: slot.show.type,
        }))
    )

    // Controlled state for calendar navigation
    const [date, setDate] = useState(new Date())
    const [view, setView] = useState<any>(Views.WEEK)

    // Sync slots and events when initialSlots changes (e.g., after navigation)
    useEffect(() => {
        setSlots(initialSlots)
        setEvents(
            initialSlots.map((slot) => ({
                id: slot.id,
                title: slot.show.title,
                start: new Date(slot.startTime),
                end: new Date(slot.endTime),
                resourceId: slot.showId,
                isRecurring: slot.isRecurring,
                type: slot.show.type,
            }))
        )
    }, [initialSlots])

    const [editSlotModalOpen, setEditSlotModalOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: Date; end: Date } | null>(null)

    const handleEventClick = async (event: any) => {
        // Find the full slot data from state instead of initialSlots
        const slot = slots.find(s => s.id === event.id)
        if (slot) {
            setSelectedSlot(slot)
            setEditSlotModalOpen(true)
        }
    }

    const handleSlotClick = useCallback((slotInfo: SlotInfo) => {
        // User clicked on an empty time slot
        setSelectedTimeSlot({
            start: slotInfo.start as Date,
            end: slotInfo.end as Date,
        })
        setScheduleModalOpen(true)
    }, [])

    // Handle calendar navigation - CRITICAL for navigation buttons to work
    const handleNavigate = useCallback((newDate: Date) => {
        setDate(newDate)
    }, [])

    // Handle view changes (Week/Day buttons)
    const handleViewChange = useCallback((newView: any) => {
        setView(newView)
    }, [])

    const eventPropGetter = (event: any) => {
        // Convert show type to CSS class name (e.g., "Local Music" -> "event-local-music")
        const typeClass = event.type
            ? `event-${event.type.toLowerCase().replace(/ /g, '-')}`
            : ''

        return {
            className: `${typeClass} ${event.isRecurring ? 'border-l-4 border-yellow-500' : ''}`,
        }
    }

    return (
        <div className="w-full h-full">
            {/* Full-Width Calendar */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 h-full">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor={(event: any) => new Date(event.start)}
                    endAccessor={(event: any) => new Date(event.end)}
                    date={date}
                    view={view}
                    onNavigate={handleNavigate}
                    onView={handleViewChange}
                    views={[Views.WEEK, Views.DAY]}
                    step={60}
                    timeslots={1}
                    selectable
                    onSelectSlot={handleSlotClick}
                    onSelectEvent={handleEventClick}
                    eventPropGetter={eventPropGetter}
                    className="text-gray-300 h-full"
                    components={{
                        event: ({ event }: any) => (
                            <div className="flex items-center gap-1 h-full px-1">
                                {event.isRecurring && <Repeat className="w-3 h-3 flex-shrink-0" />}
                                <span className="truncate text-xs">{event.title}</span>
                            </div>
                        )
                    }}
                />
            </div>

            {/* Edit Slot Modal */}
            <EditSlotModal
                isOpen={editSlotModalOpen}
                onClose={() => {
                    setEditSlotModalOpen(false)
                    setSelectedSlot(null)
                }}
                slot={selectedSlot}
                streams={streams}
            />

            {/* Schedule Modal */}
            <ScheduleModal
                isOpen={scheduleModalOpen}
                onClose={() => {
                    setScheduleModalOpen(false)
                    setSelectedTimeSlot(null)
                }}
                selectedSlot={selectedTimeSlot}
                shows={shows}
            />
        </div>
    )
}

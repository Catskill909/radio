'use client'

import { useState, useCallback, useEffect } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Repeat, Clock } from 'lucide-react'
import { Tooltip } from './Tooltip'
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
    stationTimezone: string  // ✅ STATION TIMEZONE: IANA timezone string (e.g., 'America/New_York')
}

export default function Scheduler({ shows, initialSlots, streams, stationTimezone }: SchedulerProps) {
    // ✅ STATION TIMEZONE: Convert UTC timestamps from DB to station-local time for display
    const convertSlotToEvent = useCallback((slot: Slot) => ({
        id: slot.id,
        title: slot.show.title,
        start: toZonedTime(new Date(slot.startTime), stationTimezone),
        end: toZonedTime(new Date(slot.endTime), stationTimezone),
        resourceId: slot.showId,
        isRecurring: slot.isRecurring,
        type: slot.show.type,
    }), [stationTimezone]);

    const [slots, setSlots] = useState(initialSlots)
    const [events, setEvents] = useState(
        initialSlots.map(convertSlotToEvent)
    )

    // Controlled state for calendar navigation
    // ✅ STATION TIMEZONE: Initialize to current time in station timezone
    const [date, setDate] = useState(() => toZonedTime(new Date(), stationTimezone))
    const [view, setView] = useState<any>(Views.WEEK)

    // Sync slots and events when initialSlots changes (e.g., after navigation)
    useEffect(() => {
        setSlots(initialSlots)
        setEvents(
            initialSlots.map(convertSlotToEvent)
        )
    }, [initialSlots, convertSlotToEvent])

    // DEBUG: Log event data to console
    console.log('=== SCHEDULER DEBUG ===')
    console.log('Total events:', events.length)

    // Find the 12:30 AM event
    const event1230 = events.find(e => {
        const hour = e.start.getHours()
        const minute = e.start.getMinutes()
        return (hour === 0 || hour === 12) && minute === 30
    })

    if (event1230) {
        console.log('12:30 AM EVENT FOUND:', {
            title: event1230.title,
            start: event1230.start.toLocaleString(),
            end: event1230.end.toLocaleString(),
            duration: (event1230.end.getTime() - event1230.start.getTime()) / 60000 + ' minutes',
            startTime: event1230.start.getTime(),
            endTime: event1230.end.getTime()
        })
    } else {
        console.log('12:30 AM event NOT FOUND')
    }

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
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor={(event: any) => new Date(event.start)}
                    endAccessor={(event: any) => new Date(event.end)}
                    date={date}
                    view={view}
                    onNavigate={handleNavigate}
                    onView={handleViewChange}
                    views={[Views.WEEK, Views.DAY]}
                    step={15}
                    timeslots={4}
                    selectable
                    onSelectSlot={handleSlotClick}
                    onSelectEvent={handleEventClick}
                    eventPropGetter={eventPropGetter}
                    tooltipAccessor={null}
                    getNow={() => toZonedTime(new Date(), stationTimezone)}
                    formats={{
                        eventTimeRangeFormat: () => "",
                    }}
                    className="text-gray-300 h-full"
                    components={{
                        event: ({ event }: any) => {
                            const duration = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
                            const tooltipContent = (
                                <div className="space-y-1">
                                    <div className="font-semibold">{event.title}</div>
                                    <div className="text-xs opacity-80">{event.type}</div>
                                    <div className="flex items-center gap-1 text-xs">
                                        <Clock className="w-3 h-3" />
                                        <span>{format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}</span>
                                    </div>
                                    <div className="text-xs">{duration} minutes</div>
                                    {event.isRecurring && (
                                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                                            <Repeat className="w-3 h-3" />
                                            <span>Recurring Weekly</span>
                                        </div>
                                    )}
                                </div>
                            );

                            return (
                                <Tooltip content={tooltipContent} placement="top">
                                    <div className="flex items-center gap-1 px-1 py-0.5 overflow-hidden w-full h-full">
                                        {event.isRecurring && <Repeat className="w-3 h-3 flex-shrink-0" />}
                                        <span className="truncate text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                            {event.title}
                                        </span>
                                    </div>
                                </Tooltip>
                            );
                        }
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

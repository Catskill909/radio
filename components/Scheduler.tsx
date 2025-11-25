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
    splitGroupId: string | null
    splitPosition: string | null
}

interface SchedulerProps {
    shows: Show[]
    initialSlots: Slot[]
    streams: { id: string; name: string; url: string }[]
    stationTimezone: string  // ✅ STATION TIMEZONE: IANA timezone string (e.g., 'America/New_York')
}

export default function Scheduler({ shows, initialSlots, streams, stationTimezone }: SchedulerProps) {
    // ✅ STATION TIMEZONE: Convert UTC timestamps from DB to station-local time for display
    const convertSlotToEvent = useCallback((slot: Slot) => {
        // Check if this is part of a split show
        const isSplit = slot.splitGroupId !== null;

        let start = toZonedTime(new Date(slot.startTime), stationTimezone);
        let end = toZonedTime(new Date(slot.endTime), stationTimezone);

        // FIX: Shows starting at exactly midnight (00:00:00) should appear on the NEW day
        // react-big-calendar groups events by the date of their start time
        // For midnight shows, we need to ensure they're not grouped with the previous day
        if (start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0) {
            // Add 1 millisecond so react-big-calendar interprets this as the new day
            start = new Date(start.getTime() + 1);
        }

        // WORKAROUND: react-big-calendar doesn't render events ending exactly at midnight
        // We subtract 1 second from the end time so it renders as 11:59:59 PM on the correct day
        const endMidnight = new Date(end);
        if (endMidnight.getHours() === 0 && endMidnight.getMinutes() === 0 && endMidnight.getSeconds() === 0) {
            end = new Date(end.getTime() - 1000);
        }

        return {
            id: slot.id,
            title: slot.show.title,
            start,
            end,
            resourceId: slot.showId,
            isRecurring: slot.isRecurring,
            type: slot.show.type,
            splitGroupId: slot.splitGroupId,
            splitPosition: slot.splitPosition,
            isSplit,
        };
    }, [stationTimezone]);

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

        // Add split show classes
        const splitClass = event.splitPosition === 'first'
            ? 'split-show-first'
            : event.splitPosition === 'second'
                ? 'split-show-second'
                : ''

        return {
            className: `${typeClass} ${splitClass} ${event.isRecurring ? 'border-l-4 border-yellow-500' : ''}`.trim(),
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
                                    {event.isSplit && (
                                        <div className="text-xs text-amber-400">
                                            {event.splitPosition === 'first' ? '⚡ Continues after midnight' : '⚡ Started before midnight'}
                                        </div>
                                    )}
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
                streams={streams}
                stationTimezone={stationTimezone}
            />
        </div>
    )
}

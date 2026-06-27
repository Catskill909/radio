'use client'

import { useEffect, useState } from 'react'
import { format as formatTz } from 'date-fns-tz'
import { Clock, X } from 'lucide-react'
import { getActiveDstNotice, type DstNotice } from '@/lib/dst'

interface DstBannerProps {
    /** IANA timezone string (e.g. 'America/New_York') — the Scheduler's stationTimezone prop. */
    stationTimezone: string
    /** Days before a transition to begin showing the notice. Defaults to 7 ("during the week"). */
    windowDaysBefore?: number
}

/**
 * Informational, dismissable banner shown in the run-up to a DST transition.
 *
 * This is an operator-confidence feature, NOT a correctness fix: the schedule
 * already stores UTC and renders station wall-clock correctly across DST (see
 * docs/daylight-savings.md). The banner exists so an admin viewing the DST week
 * is reassured rather than alarmed.
 *
 * Dismissal is persisted in localStorage keyed to the specific transition
 * instant, so dismissing the fall-back notice does not suppress the next
 * spring-forward notice. localStorage is read in an effect (not during render)
 * to avoid SSR/hydration mismatches.
 */
export default function DstBanner({ stationTimezone, windowDaysBefore = 7 }: DstBannerProps) {
    const [notice, setNotice] = useState<DstNotice | null>(null)

    useEffect(() => {
        const active = getActiveDstNotice(new Date(), stationTimezone, windowDaysBefore)
        if (!active) {
            setNotice(null)
            return
        }
        const key = `dst-banner-dismissed:${active.transition.at.toISOString()}`
        if (typeof window !== 'undefined' && window.localStorage.getItem(key)) {
            setNotice(null)
            return
        }
        setNotice(active)
    }, [stationTimezone, windowDaysBefore])

    if (!notice) return null

    const { transition, daysUntil } = notice
    const isForward = transition.direction === 'forward'
    const dateLabel = formatTz(transition.at, 'EEEE, MMMM d', { timeZone: stationTimezone })
    const whenLabel = daysUntil <= 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`

    const dismiss = () => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(`dst-banner-dismissed:${transition.at.toISOString()}`, '1')
        }
        setNotice(null)
    }

    return (
        <div className="flex items-start gap-3 mb-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-100">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1 text-sm leading-relaxed">
                <span className="font-semibold">
                    Clocks {isForward ? 'spring forward' : 'fall back'} {dateLabel} ({whenLabel}).
                </span>{' '}
                Your schedule already handles this — shows keep their normal times (a 7&nbsp;PM show
                stays at 7&nbsp;PM). No action needed.
                {isForward
                    ? ' Note: 2:00–2:59 AM does not exist that night, so any show in that hour displays at 3 AM for the day.'
                    : ' Note: the 1:00–1:59 AM hour repeats that night.'}
            </div>
            <button
                onClick={dismiss}
                aria-label="Dismiss daylight saving notice"
                className="flex-shrink-0 text-amber-300/70 hover:text-amber-100 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

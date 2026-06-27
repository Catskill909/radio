import { PrismaClient } from '@prisma/client'
import { add } from 'date-fns'
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz'
import { getStationTimezone } from './lib/station-time'
import { horizonThreshold, HORIZON_EXTENSION_WEEKS } from './lib/schedule-horizon'
import { recurringSeriesKey } from './lib/recurring-series'

const prisma = new PrismaClient()

/**
 * Auto-Extension Script for Recurring Radio Shows
 * 
 * This script finds recurring shows that are ending soon and extends them
 * by another 52 weeks, ensuring shows run indefinitely.
 * 
 * Run manually: npx tsx extend-recurring-shows.ts
 * Or add to cron: 0 0 * * 0 (every Sunday at midnight)
 */

async function extendRecurringShows() {
    console.log('🔍 Checking for recurring shows that need extension...\n')

    // Station timezone drives the DST-safe slot math below.
    const stationTz = getStationTimezone()

    try {
        // Find all unique recurring shows (by showId)
        const recurringSlots = await prisma.scheduleSlot.findMany({
            where: {
                isRecurring: true,
            },
            include: {
                show: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        })

        if (recurringSlots.length === 0) {
            console.log('✅ No recurring shows found.')
            return
        }

        // Group slots by recurring SERIES (recurringGroupId), not by show — so a
        // daily show (modelled as one weekly series per weekday) keeps all its days.
        const seriesGroups = new Map<string, typeof recurringSlots>()
        for (const slot of recurringSlots) {
            const key = recurringSeriesKey(slot, stationTz)
            const existing = seriesGroups.get(key) || []
            existing.push(slot)
            seriesGroups.set(key, existing)
        }

        const showCount = new Set(recurringSlots.map(s => s.showId)).size
        console.log(`📺 Found ${seriesGroups.size} recurring series across ${showCount} show(s)\n`)

        let totalExtended = 0

        // For each series, check if it needs extension
        for (const [, slots] of seriesGroups.entries()) {
            const show = slots[0].show
            const showId = slots[0].showId
            const recurringGroupId = slots[0].recurringGroupId

            // Find the latest slot for this series
            const latestSlot = slots.reduce((latest, current) => {
                return new Date(current.endTime) > new Date(latest.endTime) ? current : latest
            })

            const latestEndTime = new Date(latestSlot.endTime)
            const now = new Date()

            // Top up a series only when it is still LIVE (latest slot in the future)
            // and running low (< the rolling-horizon buffer). Requiring `> now` skips
            // abandoned remnant series whose last airing is already in the past — those
            // must not be resurrected: a fixed +52w from an old baseline generates
            // past-dated/overlapping slots and never clears the threshold (causing the
            // extend to re-fire every run). Shared with the in-service auto-extend.
            if (latestEndTime > now && latestEndTime < horizonThreshold(now)) {
                const seriesDay = formatTz(latestSlot.startTime, 'EEE HH:mm', { timeZone: stationTz })
                console.log(`⚠️  "${show.title}" [${seriesDay}] running low: ends ${latestEndTime.toLocaleDateString()}`)
                console.log(`   Extending by ${HORIZON_EXTENSION_WEEKS} weeks...`)

                // Get the original time pattern (day of week, time)
                const firstSlot = slots.reduce((earliest, current) => {
                    return new Date(current.startTime) < new Date(earliest.startTime) ? current : earliest
                })

                const duration = new Date(firstSlot.endTime).getTime() - new Date(firstSlot.startTime).getTime()

                // Create the new weekly slots starting from the latest slot + 1 week
                const slotsToCreate = []

                for (let i = 1; i <= HORIZON_EXTENSION_WEEKS; i++) {
                    // DST-SAFE: re-anchor each weekly slot to the station wall-clock time
                    // for its own date so the correct UTC offset (EDT/EST) is applied
                    // across a DST boundary. Naive `setDate(+7)` preserves the UTC instant
                    // and drifts the wall-clock time by 1h after a transition. Mirrors the
                    // in-service auto-extend (recorder-service.ts) and server actions.
                    const latestStationStart = toZonedTime(new Date(latestSlot.startTime), stationTz)
                    const futureStationStart = add(latestStationStart, { weeks: i })
                    const newStartTime = fromZonedTime(
                        formatTz(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                        stationTz
                    )

                    const newEndTime = new Date(newStartTime.getTime() + duration)

                    slotsToCreate.push({
                        showId: showId,
                        startTime: newStartTime,
                        endTime: newEndTime,
                        sourceUrl: firstSlot.sourceUrl,
                        isRecurring: true,
                        recurringGroupId: recurringGroupId, // keep the slot in its series
                    })
                }

                // Drop only the individual slots that would overlap a DIFFERENT show
                // (e.g. a 2 AM show shifted to 3 AM on the spring-forward day), keeping
                // the rest of the series — never a double-booking, never losing a whole
                // year over one DST-day collision. Matches the in-service auto-extend.
                const toCreate = []
                let skipped = 0
                for (const newSlot of slotsToCreate) {
                    const overlapping = await prisma.scheduleSlot.findFirst({
                        where: {
                            showId: { not: showId },
                            startTime: { lt: newSlot.endTime },
                            endTime: { gt: newSlot.startTime },
                        },
                        include: { show: true },
                    })

                    if (overlapping) {
                        console.log(`   ⏭️  Skipping ${formatTz(newSlot.startTime, 'MMM d', { timeZone: stationTz })} (overlaps "${overlapping.show.title}")`)
                        skipped++
                    } else {
                        toCreate.push(newSlot)
                    }
                }

                if (toCreate.length > 0) {
                    await prisma.scheduleSlot.createMany({ data: toCreate })
                    const newLatestEndTime = toCreate[toCreate.length - 1].endTime
                    console.log(`   ✅ Extended to ${newLatestEndTime.toLocaleDateString()} (+${toCreate.length} slots${skipped ? `, skipped ${skipped} overlapping` : ''})\n`)
                    totalExtended++
                } else {
                    console.log(`   ⚠️  Nothing to add (all ${skipped} slots overlapped)\n`)
                }
            } else {
                const weeksRemaining = Math.ceil((latestEndTime.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000))
                console.log(`✅ "${show.title}" - OK (${weeksRemaining} weeks remaining)\n`)
            }
        }

        if (totalExtended > 0) {
            console.log(`\n🎉 Successfully extended ${totalExtended} show(s)`)
        } else {
            console.log(`\n✅ All recurring shows are good for now`)
        }

    } catch (error) {
        console.error('❌ Error extending recurring shows:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the script
extendRecurringShows()
    .then(() => {
        console.log('\n✨ Done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error)
        process.exit(1)
    })

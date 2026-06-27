import { PrismaClient } from '@prisma/client'
import { format as formatTz } from 'date-fns-tz'
import { getStationTimezone } from './lib/station-time'
import { horizonTarget } from './lib/schedule-horizon'
import { recurringSeriesKey, planMissingSeriesSlots } from './lib/recurring-series'

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

        const now = new Date()
        let totalExtended = 0

        // For each series, fill internal gaps AND extend forward in one pass.
        for (const [, slots] of seriesGroups.entries()) {
            const show = slots[0].show
            const showId = slots[0].showId
            const recurringGroupId = slots[0].recurringGroupId

            // Find the latest slot for this series (pattern anchor).
            const latestSlot = slots.reduce((latest, current) => {
                return new Date(current.startTime) > new Date(latest.startTime) ? current : latest
            })

            // Skip abandoned remnant series whose last airing is already in the past —
            // they must not be resurrected (would generate past-dated slots).
            if (new Date(latestSlot.endTime) <= now) continue

            // Ensure a weekly slot every week from `from` through the horizon (or the
            // series' existing latest slot, whichever is later): fills internal gaps
            // AND extends forward. `from` is the later of now and the series' first
            // slot, so we never backfill the past or create slots before a future-dated
            // series begins. Idempotent, DST-aware. Mirrors the in-service auto-extend.
            const earliestStart = new Date(slots[0].startTime) // query orders by startTime asc
            const from = new Date(Math.max(now.getTime(), earliestStart.getTime()))
            const until = new Date(Math.max(new Date(latestSlot.startTime).getTime(), horizonTarget(now).getTime()))
            const missing = planMissingSeriesSlots({ slots, stationTz, from, until })
            if (missing.length === 0) continue

            const seriesDay = formatTz(latestSlot.startTime, 'EEE HH:mm', { timeZone: stationTz })

            // Drop only the slots that would overlap a DIFFERENT show.
            const toCreate = []
            let skipped = 0
            for (const slot of missing) {
                const overlapping = await prisma.scheduleSlot.findFirst({
                    where: {
                        showId: { not: showId },
                        startTime: { lt: slot.endTime },
                        endTime: { gt: slot.startTime },
                    },
                    include: { show: true },
                })
                if (overlapping) {
                    console.log(`   ⏭️  Skipping ${formatTz(slot.startTime, 'MMM d', { timeZone: stationTz })} (overlaps "${overlapping.show.title}")`)
                    skipped++
                } else {
                    toCreate.push({
                        showId: showId,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        sourceUrl: latestSlot.sourceUrl,
                        isRecurring: true,
                        recurringGroupId: recurringGroupId, // keep the slot in its series
                    })
                }
            }

            if (toCreate.length > 0) {
                await prisma.scheduleSlot.createMany({ data: toCreate })
                console.log(`✅ "${show.title}" [${seriesDay}] +${toCreate.length} slot(s)${skipped ? `, skipped ${skipped} overlapping` : ''}`)
                totalExtended++
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

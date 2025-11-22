import { PrismaClient } from '@prisma/client'

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

        // Group slots by show
        const showGroups = new Map<string, typeof recurringSlots>()
        for (const slot of recurringSlots) {
            const existing = showGroups.get(slot.showId) || []
            existing.push(slot)
            showGroups.set(slot.showId, existing)
        }

        console.log(`📺 Found ${showGroups.size} recurring show(s)\n`)

        let totalExtended = 0

        // For each show, check if it needs extension
        for (const [showId, slots] of showGroups.entries()) {
            const show = slots[0].show
            
            // Find the latest slot for this show
            const latestSlot = slots.reduce((latest, current) => {
                return new Date(current.endTime) > new Date(latest.endTime) ? current : latest
            })

            const latestEndTime = new Date(latestSlot.endTime)
            const now = new Date()
            const fourWeeksFromNow = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000))

            // Check if the show ends within the next 4 weeks
            if (latestEndTime < fourWeeksFromNow) {
                console.log(`⚠️  "${show.title}" ends soon: ${latestEndTime.toLocaleDateString()}`)
                console.log(`   Extending by 52 weeks...`)

                // Get the original time pattern (day of week, time)
                const firstSlot = slots.reduce((earliest, current) => {
                    return new Date(current.startTime) < new Date(earliest.startTime) ? current : earliest
                })

                const duration = new Date(firstSlot.endTime).getTime() - new Date(firstSlot.startTime).getTime()

                // Create 52 new weekly slots starting from the latest slot + 1 week
                const slotsToCreate = []

                for (let i = 1; i <= 52; i++) {
                    const newStartTime = new Date(latestSlot.startTime)
                    newStartTime.setDate(newStartTime.getDate() + (i * 7))

                    const newEndTime = new Date(newStartTime.getTime() + duration)

                    slotsToCreate.push({
                        showId: showId,
                        startTime: newStartTime,
                        endTime: newEndTime,
                        sourceUrl: firstSlot.sourceUrl,
                        isRecurring: true,
                    })
                }

                // Check for overlaps before creating
                let hasOverlap = false
                for (const newSlot of slotsToCreate) {
                    const overlapping = await prisma.scheduleSlot.findFirst({
                        where: {
                            OR: [
                                {
                                    startTime: { lte: newSlot.startTime },
                                    endTime: { gt: newSlot.startTime },
                                },
                                {
                                    startTime: { lt: newSlot.endTime },
                                    endTime: { gte: newSlot.endTime },
                                },
                                {
                                    startTime: { gte: newSlot.startTime },
                                    endTime: { lte: newSlot.endTime },
                                },
                            ],
                        },
                        include: {
                            show: true,
                        },
                    })

                    if (overlapping && overlapping.showId !== showId) {
                        console.log(`   ❌ Cannot extend: would overlap with "${overlapping.show.title}"`)
                        hasOverlap = true
                        break
                    }
                }

                if (!hasOverlap) {
                    await prisma.scheduleSlot.createMany({
                        data: slotsToCreate,
                    })

                    const newLatestEndTime = slotsToCreate[slotsToCreate.length - 1].endTime
                    console.log(`   ✅ Extended to ${newLatestEndTime.toLocaleDateString()} (+52 weeks)\n`)
                    totalExtended++
                } else {
                    console.log(`   ⚠️  Skipped due to overlap\n`)
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

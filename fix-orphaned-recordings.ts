/**
 * Fix Orphaned Recordings Script
 * 
 * This script finds recordings stuck in RECORDING status where the schedule slot
 * has already ended, and finalizes them properly (marking as COMPLETED or FAILED).
 */

import { PrismaClient } from '@prisma/client'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

async function fixOrphanedRecordings() {
    const now = new Date()
    console.log('=== Fix Orphaned Recordings ===')
    console.log(`Current time: ${now.toISOString()}`)
    console.log('')

    // Find orphaned recordings: status is RECORDING but slot has ended
    const orphanedRecordings = await prisma.recording.findMany({
        where: {
            status: 'RECORDING',
            scheduleSlot: {
                endTime: { lt: now }
            }
        },
        include: {
            scheduleSlot: {
                include: { show: true }
            }
        }
    })

    if (orphanedRecordings.length === 0) {
        console.log('✅ No orphaned recordings found!')
        await prisma.$disconnect()
        return
    }

    console.log(`Found ${orphanedRecordings.length} orphaned recording(s):`)

    for (const recording of orphanedRecordings) {
        const showTitle = recording.scheduleSlot?.show?.title || 'Unknown'
        const slotEnd = recording.scheduleSlot?.endTime
        console.log(`\n📍 ${showTitle}`)
        console.log(`   Recording ID: ${recording.id}`)
        console.log(`   Started: ${recording.startTime?.toISOString()}`)
        console.log(`   Slot ended: ${slotEnd?.toISOString()}`)
        console.log(`   File: ${recording.filePath}`)

        const filePath = path.join(RECORDINGS_DIR, recording.filePath || '')
        const fileExists = recording.filePath && fs.existsSync(filePath)

        if (fileExists) {
            console.log(`   ✅ File exists (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB)`)

            // Get duration from file
            let duration = 0
            try {
                duration = await new Promise<number>((resolve) => {
                    ffmpeg.ffprobe(filePath, (err, metadata) => {
                        if (!err && metadata?.format?.duration) {
                            resolve(Math.round(metadata.format.duration))
                        } else {
                            // Fallback to time difference
                            const fallbackDuration = Math.round(
                                (slotEnd!.getTime() - recording.startTime!.getTime()) / 1000
                            )
                            resolve(fallbackDuration)
                        }
                    })
                })
            } catch {
                duration = Math.round((slotEnd!.getTime() - recording.startTime!.getTime()) / 1000)
            }

            const size = fs.statSync(filePath).size

            // Update recording to COMPLETED
            await prisma.recording.update({
                where: { id: recording.id },
                data: {
                    status: 'COMPLETED',
                    endTime: slotEnd, // Use slot end time as recording end
                    duration: duration,
                    size: size
                }
            })
            console.log(`   ✅ Marked as COMPLETED (duration: ${Math.floor(duration / 60)}m ${duration % 60}s)`)

            // Check if episode already exists
            const existingEpisode = await prisma.episode.findUnique({
                where: { recordingId: recording.id }
            })

            if (!existingEpisode && recording.scheduleSlot?.show) {
                const show = recording.scheduleSlot.show
                const formattedDate = new Date(recording.startTime!).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })

                await prisma.episode.create({
                    data: {
                        recordingId: recording.id,
                        title: `${show.title} - ${formattedDate}`,
                        description: show.description || `Recorded episode of ${show.title}`,
                        publishedAt: new Date(),
                        duration: duration,
                        host: show.host,
                        imageUrl: show.image,
                        tags: show.type
                    }
                })
                console.log(`   ✅ Episode auto-published`)
            } else if (existingEpisode) {
                console.log(`   ℹ️  Episode already exists`)
            }

        } else {
            console.log(`   ❌ File NOT found`)

            // Mark as FAILED since file doesn't exist
            await prisma.recording.update({
                where: { id: recording.id },
                data: {
                    status: 'FAILED',
                    endTime: slotEnd
                }
            })
            console.log(`   ⚠️  Marked as FAILED (file missing)`)
        }
    }

    console.log('\n=== Done ===')
    await prisma.$disconnect()
}

fixOrphanedRecordings().catch(console.error)

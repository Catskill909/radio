import { PrismaClient } from '@prisma/client'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR)
}

// Map to track active recordings: slotId -> ffmpegCommand
const activeRecordings = new Map<string, ffmpeg.FfmpegCommand>()

async function checkSchedule() {
    const now = new Date()
    console.log(`[${now.toISOString()}] Checking schedule...`)

    try {
        // Find active slots
        const activeSlots = await prisma.scheduleSlot.findMany({
            where: {
                startTime: { lte: now },
                endTime: { gt: now },
            },
            include: {
                show: true,
            },
        })

        for (const slot of activeSlots) {
            // Check if we are already recording this slot
            if (activeRecordings.has(slot.id)) {
                continue
            }

            // Check if a recording record already exists in DB (e.g. from a previous run)
            const existingRecording = await prisma.recording.findFirst({
                where: { scheduleSlotId: slot.id },
            })

            if (existingRecording) {
                // If it's marked as RECORDING but not in our memory, it might be an orphan from a crash.
                // For now, we won't resume, just skip.
                continue
            }

            // Start new recording
            console.log(`Starting recording for slot: ${slot.id} (${slot.show.title})`)
            // Fix Race Condition: Mark as active immediately before async operations
            // We use a placeholder value initially
            activeRecordings.set(slot.id, null as any)
            startRecording(slot)
        }

        // Stop finished recordings
        for (const [slotId, command] of activeRecordings.entries()) {
            // If command is null, it's still starting up, so don't touch it
            if (!command) continue;

            const slot = await prisma.scheduleSlot.findUnique({ where: { id: slotId } })
            if (!slot || slot.endTime <= now) {
                console.log(`Stopping recording for slot: ${slotId}`)
                command.kill('SIGKILL') // This should trigger the 'end' event or 'error'
                activeRecordings.delete(slotId)
            }
        }

    } catch (error) {
        console.error('Error checking schedule:', error)
    }
}

async function startRecording(slot: any) {
    // Fix Risky Fallback: Remove hardcoded fallback
    const sourceUrl = slot.sourceUrl || slot.show.recordingSource

    if (!sourceUrl) {
        console.warn(`No recording source for show ${slot.show.title} (${slot.id}). Skipping.`)
        activeRecordings.delete(slot.id) // Remove the placeholder
        return
    }

    const filename = `show-${slot.show.id}-${Date.now()}.mp3`
    const filePath = path.join(RECORDINGS_DIR, filename)

    // Create DB record
    const recording = await prisma.recording.create({
        data: {
            scheduleSlotId: slot.id,
            filePath: filename, // Store relative path or filename
            startTime: new Date(),
            status: 'RECORDING',
        },
    })

    const command = ffmpeg(sourceUrl)
        .audioCodec('copy') // Direct stream copy
        .on('start', (commandLine) => {
            console.log(`FFmpeg started for ${slot.show.title}`)
            console.log(`Command: ${commandLine}`)
        })
        .on('error', async (err) => {
            // Check if error is due to SIGKILL (intentional stop)
            if (err.message.includes('SIGKILL')) {
                console.log(`Recording stopped intentionally for ${slot.show.title}`)
                await handleRecordingCompletion(recording, slot, filePath)
            } else {
                console.error(`FFmpeg error for ${slot.show.title}:`, err.message)
                activeRecordings.delete(slot.id)

                await prisma.recording.update({
                    where: { id: recording.id },
                    data: {
                        status: 'FAILED',
                        endTime: new Date()
                    },
                })
            }
        })
        .on('end', async () => {
            console.log(`FFmpeg finished for ${slot.show.title}`)
            await handleRecordingCompletion(recording, slot, filePath)
        })
        .save(filePath)

    // Update the map with the actual command
    activeRecordings.set(slot.id, command)
}

async function handleRecordingCompletion(recording: any, slot: any, filePath: string) {
    activeRecordings.delete(slot.id)

    const endTime = new Date()
    let size = 0
    let duration = 0

    try {
        // Get file size
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath)
            size = stats.size
        }

        // Get duration using ffprobe
        await new Promise<void>((resolve) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (!err && metadata && metadata.format && metadata.format.duration) {
                    duration = Math.round(metadata.format.duration)
                } else {
                    // Fallback to time difference
                    duration = Math.round((endTime.getTime() - recording.startTime.getTime()) / 1000)
                }
                resolve()
            })
        })
    } catch (e) {
        console.error('Error getting recording metadata:', e)
        // Fallback to time difference if everything fails
        if (duration === 0) {
            duration = Math.round((endTime.getTime() - recording.startTime.getTime()) / 1000)
        }
    }

    const updatedRecording = await prisma.recording.update({
        where: { id: recording.id },
        data: {
            status: 'COMPLETED',
            endTime: endTime,
            size: size,
            duration: duration
        },
    })

    // Auto-publish as episode
    console.log(`Auto-publishing episode for recording ${recording.id}`)
    const show = slot.show
    const formattedDate = new Date(recording.startTime).toLocaleDateString('en-US', {
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
            tags: show.type, // Use show type as initial tag
        }
    })
    console.log(`Episode published successfully for ${show.title}`)
}

// Graceful Shutdown
function cleanup() {
    console.log('Stopping recorder service...')
    for (const [slotId, command] of activeRecordings.entries()) {
        if (command) {
            console.log(`Killing recording for slot ${slotId}`)
            command.kill('SIGKILL')
        }
    }
    process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// Run every 10 seconds
setInterval(checkSchedule, 10000)
checkSchedule() // Initial run

console.log('Recorder service started.')

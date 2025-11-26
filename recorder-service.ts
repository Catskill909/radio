import { PrismaClient } from '@prisma/client'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { formatInStationTime, getStationTimezone } from './lib/station-time'

const prisma = new PrismaClient()
const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR)
}

// Map to track active recordings: slotId -> ffmpegCommand
const activeRecordings = new Map<string, ffmpeg.FfmpegCommand>()

async function checkSchedule() {
    const now = new Date()  // UTC time for comparison with DB
    const stationTz = getStationTimezone()
    const nowStation = formatInStationTime(now, 'yyyy-MM-dd HH:mm:ss')
    console.log(`[${now.toISOString()}] Checking schedule... (Station time: ${nowStation} ${stationTz})`)

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
            const slotStartStation = formatInStationTime(slot.startTime, 'HH:mm')
            const slotEndStation = formatInStationTime(slot.endTime, 'HH:mm')
            console.log(`Starting recording for slot: ${slot.id} (${slot.show.title}) - Station time: ${slotStartStation}-${slotEndStation} ${stationTz})`)
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
                const endStation = slot ? formatInStationTime(slot.endTime, 'HH:mm') : 'unknown'
                console.log(`Stopping recording for slot: ${slotId} (ended at ${endStation} ${stationTz})`)
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

    // Get encoding settings from database
    const settings = await prisma.stationSettings.findUnique({
        where: { id: 'station' }
    })

    const audioCodec = settings?.audioCodec || 'libmp3lame'
    const audioBitrate = settings?.audioBitrate || 192
    const audioSampleRate = settings?.audioSampleRate
    const audioVBR = settings?.audioVBR ?? true

    // Check stream format to decide on transcoding
    let useTranscoding = false;
    try {
        await new Promise<void>((resolve) => {
            ffmpeg.ffprobe(sourceUrl, (err, metadata) => {
                if (!err && metadata && metadata.streams) {
                    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
                    // If codec is not mp3, we must transcode to fit in .mp3 container
                    if (audioStream && audioStream.codec_name !== 'mp3') {
                        console.log(`Stream codec is ${audioStream.codec_name}, enabling transcoding to ${audioCodec}`)
                        useTranscoding = true;
                    }
                } else {
                    console.warn(`Could not probe stream ${sourceUrl}, defaulting to transcoding for safety`)
                    useTranscoding = true;
                }
                resolve();
            });
        });
    } catch (e) {
        console.error(`Error probing stream, defaulting to transcoding:`, e);
        useTranscoding = true;
    }

    const command = ffmpeg(sourceUrl)

    if (useTranscoding) {
        // Apply encoding settings from database
        command.audioCodec(audioCodec)

        // Apply bitrate for lossy codecs (not FLAC)
        if (audioCodec !== 'flac') {
            if (audioVBR) {
                // Variable Bitrate
                command.audioBitrate(`${audioBitrate}k`)
            } else {
                // Constant Bitrate
                command.audioBitrate(`${audioBitrate}k`).audioQuality(0)
            }
        }

        // Apply sample rate if specified
        if (audioSampleRate) {
            command.audioFrequency(audioSampleRate)
        }

        console.log(`Encoding with: ${audioCodec} @ ${audioBitrate}kbps (${audioVBR ? 'VBR' : 'CBR'})${audioSampleRate ? ` ${audioSampleRate}Hz` : ''}`)
    } else {
        command.audioCodec('copy')
    }

    command
        .on('start', (commandLine) => {
            console.log(`FFmpeg started for ${slot.show.title} (Transcoding: ${useTranscoding})`)
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

    // Get encoding settings that were used for this recording
    const settings = await prisma.stationSettings.findUnique({
        where: { id: 'station' }
    })

    const updatedRecording = await prisma.recording.update({
        where: { id: recording.id },
        data: {
            status: 'COMPLETED',
            endTime: endTime,
            size: size,
            duration: duration,
            // Save quality metadata
            audioCodec: settings?.audioCodec || null,
            audioBitrate: settings?.audioBitrate || null,
            audioSampleRate: settings?.audioSampleRate || null,
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

// Auto-extend recurring shows function
async function extendRecurringShows() {
    console.log('[AUTO-EXTEND] Checking for recurring shows that need extension...')

    try {
        const recurringSlots = await prisma.scheduleSlot.findMany({
            where: { isRecurring: true },
            include: { show: true },
            orderBy: { startTime: 'asc' },
        })

        if (recurringSlots.length === 0) return

        // Group slots by show
        const showGroups = new Map<string, typeof recurringSlots>()
        for (const slot of recurringSlots) {
            const existing = showGroups.get(slot.showId) || []
            existing.push(slot)
            showGroups.set(slot.showId, existing)
        }

        let totalExtended = 0

        for (const [showId, slots] of showGroups.entries()) {
            const show = slots[0].show
            const latestSlot = slots.reduce((latest, current) => {
                return new Date(current.endTime) > new Date(latest.endTime) ? current : latest
            })

            const latestEndTime = new Date(latestSlot.endTime)
            const now = new Date()
            const fourWeeksFromNow = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000))

            // Check if the show ends within the next 4 weeks
            if (latestEndTime < fourWeeksFromNow) {
                console.log(`[AUTO-EXTEND] "${show.title}" needs extension - ends ${latestEndTime.toLocaleDateString()}`)

                const firstSlot = slots.reduce((earliest, current) => {
                    return new Date(current.startTime) < new Date(earliest.startTime) ? current : earliest
                })

                const duration = new Date(firstSlot.endTime).getTime() - new Date(firstSlot.startTime).getTime()
                const slotsToCreate = []

                // ✅ DST-AWARE: Use timezone-aware logic for extension
                const { add } = require('date-fns');
                const { toZonedTime, fromZonedTime, format: formatTz } = require('date-fns-tz');
                const stationTz = getStationTimezone();

                for (let i = 1; i <= 52; i++) {
                    // Convert latest slot to station time
                    const latestStationStart = toZonedTime(new Date(latestSlot.startTime), stationTz);

                    // Add weeks in station timezone (maintains wall-clock time)
                    const futureStationStart = add(latestStationStart, { weeks: i });

                    // Convert back to UTC
                    const newStartTime = fromZonedTime(
                        formatTz(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                        stationTz
                    );
                    const newEndTime = new Date(newStartTime.getTime() + duration)

                    slotsToCreate.push({
                        showId: showId,
                        startTime: newStartTime,
                        endTime: newEndTime,
                        sourceUrl: firstSlot.sourceUrl,
                        isRecurring: true,
                    })
                }

                await prisma.scheduleSlot.createMany({
                    data: slotsToCreate,
                })

                console.log(`[AUTO-EXTEND] ✅ Extended "${show.title}" by 52 weeks`)
                totalExtended++
            }
        }

        if (totalExtended > 0) {
            console.log(`[AUTO-EXTEND] Extended ${totalExtended} show(s) automatically`)
        }
    } catch (error) {
        console.error('[AUTO-EXTEND] Error extending recurring shows:', error)
    }
}

// Run schedule check every 10 seconds
setInterval(checkSchedule, 10000)
checkSchedule() // Initial run

// Run auto-extend check once per day (every 24 hours)
setInterval(extendRecurringShows, 24 * 60 * 60 * 1000)
extendRecurringShows() // Initial run on startup

console.log('Recorder service started.')
console.log('Auto-extension enabled: recurring shows will be extended automatically.')

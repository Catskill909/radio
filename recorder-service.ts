import { PrismaClient } from '@prisma/client'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { formatInStationTime, getStationTimezone } from './lib/station-time'
import { generateRecordingFilename } from './lib/filename-utils'

const prisma = new PrismaClient()
const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR)
}

// Map to track active recordings: slotId -> ffmpegCommand
const activeRecordings = new Map<string, ffmpeg.FfmpegCommand>()

// Helper to broadcast recording events via WebSocket API
async function broadcastRecordingEvent(event: {
    type: 'started' | 'completed' | 'failed'
    slotId: string
    recordingId?: string
    showTitle: string
    showId: string
    startTime?: string
    endTime?: string
    duration?: number
    error?: string
}) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/recording-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        })
    } catch (error) {
        // Don't fail recording if WebSocket broadcast fails
        console.warn('[WebSocket] Failed to broadcast recording event:', error)
    }
}

// Track last known current show to detect transitions
let lastCurrentShowId: string | null = null

// Helper to broadcast now-playing changes via WebSocket API
async function broadcastNowPlaying() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/now-playing-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // API will fetch current state
        })
    } catch (error) {
        console.warn('[WebSocket] Failed to broadcast now-playing:', error)
    }
}

// Check for show transitions and broadcast changes
async function checkShowTransitions() {
    try {
        const now = new Date()

        const currentSlot = await prisma.scheduleSlot.findFirst({
            where: {
                startTime: { lte: now },
                endTime: { gt: now },
            },
            include: { show: true },
        })

        const currentShowId = currentSlot?.show.id || null

        // Detect transition
        if (currentShowId !== lastCurrentShowId) {
            const fromShow = lastCurrentShowId ? 'previous show' : 'no show'
            const toShow = currentSlot?.show.title || 'no show'
            console.log(`[NOW PLAYING] Show transition: ${fromShow} → ${toShow}`)

            lastCurrentShowId = currentShowId
            await broadcastNowPlaying()
        }
    } catch (error) {
        console.error('[NOW PLAYING] Error checking transitions:', error)
    }
}

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

            // Check if recording is enabled - slot override takes precedence over show default
            const shouldRecord = slot.recordingOverride !== null
                ? slot.recordingOverride
                : slot.show.recordingEnabled;

            if (!shouldRecord) {
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

            const slot = await prisma.scheduleSlot.findUnique({
                where: { id: slotId },
                include: { show: true }
            })

            // Check if recording should continue - slot override takes precedence
            const shouldRecord = slot
                ? (slot.recordingOverride !== null ? slot.recordingOverride : slot.show.recordingEnabled)
                : false;

            if (!slot || slot.endTime <= now || !shouldRecord) {
                const endStation = slot ? formatInStationTime(slot.endTime, 'HH:mm') : 'unknown'
                const reason = !slot ? 'slot deleted' : (slot.endTime <= now ? 'slot ended' : 'recording disabled')
                console.log(`Stopping recording for slot: ${slotId} (${reason} - ended at ${endStation} ${stationTz})`)
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

    // Get encoding settings from database BEFORE generating filename
    const settings = await prisma.stationSettings.findUnique({
        where: { id: 'station' }
    })

    const audioCodec = settings?.audioCodec || 'libmp3lame'
    const audioBitrate = settings?.audioBitrate || 192
    const audioSampleRate = settings?.audioSampleRate
    const audioVBR = settings?.audioVBR ?? true

    // Generate human-readable filename
    const recordingStartTime = new Date()
    const filename = generateRecordingFilename(
        slot.show.title,
        recordingStartTime,
        audioCodec
    )
    const filePath = path.join(RECORDINGS_DIR, filename)

    // Create DB record
    const recording = await prisma.recording.create({
        data: {
            scheduleSlotId: slot.id,
            filePath: filename, // Store relative path or filename
            startTime: recordingStartTime,
            status: 'RECORDING',
        },
    })

    // Broadcast recording started event
    broadcastRecordingEvent({
        type: 'started',
        slotId: slot.id,
        recordingId: recording.id,
        showTitle: slot.show.title,
        showId: slot.show.id,
        startTime: recordingStartTime.toISOString()
    })

    // Always apply encoding settings from database to respect user preferences
    const command = ffmpeg(sourceUrl)

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

    command
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

                // Broadcast recording failed event
                broadcastRecordingEvent({
                    type: 'failed',
                    slotId: slot.id,
                    recordingId: recording.id,
                    showTitle: slot.show.title,
                    showId: slot.show.id,
                    error: err.message
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

    // Post-processing to fix MP3 headers for seeking
    // When recording live streams, the duration header is often missing or incorrect.
    // We remux the file (copy stream) to fix the headers.
    const tempPath = filePath + '.temp'

    try {
        if (fs.existsSync(filePath)) {
            console.log(`Finalizing recording for ${slot.show.title}...`)

            // 1. Rename original to temp
            fs.renameSync(filePath, tempPath)

            // 2. Remux to fix headers (using promise wrapper for async/await)
            await new Promise<void>((resolve, reject) => {
                ffmpeg(tempPath)
                    .audioCodec('copy')
                    .on('error', (err) => {
                        console.error('Error finalizing recording:', err)
                        // Restore original if fail
                        if (fs.existsSync(tempPath)) {
                            fs.renameSync(tempPath, filePath)
                        }
                        reject(err)
                    })
                    .on('end', () => {
                        console.log('Recording finalized successfully')
                        // 3. Delete temp
                        if (fs.existsSync(tempPath)) {
                            fs.unlinkSync(tempPath)
                        }
                        resolve()
                    })
                    .save(filePath)
            })
        }
    } catch (error) {
        console.error('Failed to finalize recording:', error)
        // Ensure we at least have the file back at filePath if something went wrong
        if (fs.existsSync(tempPath) && !fs.existsSync(filePath)) {
            fs.renameSync(tempPath, filePath)
        }
    }

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

    // Self-healing: Verify file exists and has content before marking COMPLETED
    if (!fs.existsSync(filePath) || size < 1024) {
        console.error(`[SELF-HEAL] Recording file missing or too small for ${slot.show.title} (size: ${size} bytes)`)
        await prisma.recording.update({
            where: { id: recording.id },
            data: { status: 'FAILED', endTime: endTime }
        })
        broadcastRecordingEvent({
            type: 'failed',
            slotId: slot.id,
            recordingId: recording.id,
            showTitle: slot.show.title,
            showId: slot.show.id,
            error: 'Recording file missing or empty'
        })
        return
    }

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
        } as any,
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

    // Broadcast recording completed event
    broadcastRecordingEvent({
        type: 'completed',
        slotId: slot.id,
        recordingId: recording.id,
        showTitle: show.title,
        showId: show.id,
        endTime: endTime.toISOString(),
        duration: duration
    })
}

// Recover orphaned recordings (stuck in RECORDING status after service restart)
async function recoverOrphanedRecordings() {
    const now = new Date()

    // Find recordings that are marked as RECORDING but their slot has ended
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

    if (orphanedRecordings.length === 0) return

    console.log(`[RECOVERY] Found ${orphanedRecordings.length} orphaned recording(s)`)

    for (const recording of orphanedRecordings) {
        const showTitle = recording.scheduleSlot?.show?.title || 'Unknown'
        const slotEnd = recording.scheduleSlot?.endTime
        const filePath = path.join(RECORDINGS_DIR, recording.filePath || '')
        const fileExists = recording.filePath && fs.existsSync(filePath)

        console.log(`[RECOVERY] Finalizing: ${showTitle}`)

        if (fileExists) {
            // Get duration from file
            let duration = 0
            try {
                duration = await new Promise<number>((resolve) => {
                    ffmpeg.ffprobe(filePath, (err, metadata) => {
                        if (!err && metadata?.format?.duration) {
                            resolve(Math.round(metadata.format.duration))
                        } else {
                            resolve(Math.round((slotEnd!.getTime() - recording.startTime!.getTime()) / 1000))
                        }
                    })
                })
            } catch {
                duration = Math.round((slotEnd!.getTime() - recording.startTime!.getTime()) / 1000)
            }

            const size = fs.statSync(filePath).size

            // Update to COMPLETED
            await prisma.recording.update({
                where: { id: recording.id },
                data: {
                    status: 'COMPLETED',
                    endTime: slotEnd,
                    duration: duration,
                    size: size
                }
            })

            // Auto-publish episode if not exists
            const existingEpisode = await prisma.episode.findUnique({
                where: { recordingId: recording.id }
            })

            if (!existingEpisode && recording.scheduleSlot?.show) {
                const show = recording.scheduleSlot.show
                const formattedDate = new Date(recording.startTime!).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
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
                console.log(`[RECOVERY] ✅ ${showTitle} - COMPLETED & published`)
            } else {
                console.log(`[RECOVERY] ✅ ${showTitle} - COMPLETED`)
            }

            // Broadcast completion event
            broadcastRecordingEvent({
                type: 'completed',
                slotId: recording.scheduleSlotId || '',
                recordingId: recording.id,
                showTitle: showTitle,
                showId: recording.scheduleSlot?.show?.id || '',
                endTime: slotEnd?.toISOString(),
                duration: duration
            })
        } else {
            // Mark as FAILED since file doesn't exist
            await prisma.recording.update({
                where: { id: recording.id },
                data: {
                    status: 'FAILED',
                    endTime: slotEnd
                }
            })
            console.log(`[RECOVERY] ⚠️ ${showTitle} - FAILED (file missing)`)

            broadcastRecordingEvent({
                type: 'failed',
                slotId: recording.scheduleSlotId || '',
                recordingId: recording.id,
                showTitle: showTitle,
                showId: recording.scheduleSlot?.show?.id || '',
                error: 'Recording file not found after service restart'
            })
        }
    }
}

// Clean up old backup files from audio editing (older than 7 days)
function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(RECORDINGS_DIR)
        const backupFiles = files.filter(f => f.includes('.backup_'))

        if (backupFiles.length === 0) return

        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        let cleaned = 0

        for (const file of backupFiles) {
            const filePath = path.join(RECORDINGS_DIR, file)
            try {
                const stats = fs.statSync(filePath)
                if (stats.mtimeMs < sevenDaysAgo) {
                    fs.unlinkSync(filePath)
                    console.log(`[CLEANUP] Removed old backup: ${file}`)
                    cleaned++
                }
            } catch (e) {
                // Skip files that can't be accessed
            }
        }

        if (cleaned > 0) {
            console.log(`[CLEANUP] Removed ${cleaned} old backup file(s)`)
        }
    } catch (error) {
        console.error('[CLEANUP] Error cleaning backups:', error)
    }
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

// Recover any orphaned recordings on startup
recoverOrphanedRecordings().then(() => {
    console.log('Orphan recovery check complete.')
})

// Run schedule check every 10 seconds
setInterval(checkSchedule, 10000)
checkSchedule() // Initial run

// Run auto-extend check once per day (every 24 hours)
setInterval(extendRecurringShows, 24 * 60 * 60 * 1000)
extendRecurringShows() // Initial run on startup

// Check for show transitions every 5 seconds (for instant Now Playing updates)
setInterval(checkShowTransitions, 5000)
checkShowTransitions() // Initial run

// Run backup cleanup once per day (every 24 hours)
setInterval(cleanupOldBackups, 24 * 60 * 60 * 1000)
cleanupOldBackups() // Initial run on startup

console.log('Recorder service started.')
console.log('Auto-extension enabled: recurring shows will be extended automatically.')
console.log('Now Playing: monitoring for show transitions.')
console.log('Orphan recovery: enabled on startup.')
console.log('Backup cleanup: enabled (removes backups older than 7 days).')


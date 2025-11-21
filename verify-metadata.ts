import { PrismaClient } from '@prisma/client'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR)
}

async function testMetadataCapture() {
    console.log('Starting metadata verification...')

    // 1. Create a dummy recording file (1 second of silence)
    const filename = `test-metadata-${Date.now()}.mp3`
    const filePath = path.join(RECORDINGS_DIR, filename)

    console.log('Generating test audio file...')
    const { exec } = require('child_process')
    const util = require('util')
    const execPromise = util.promisify(exec)

    try {
        await execPromise(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 2 -acodec libmp3lame -y "${filePath}"`)
    } catch (e) {
        console.error('Failed to generate audio via ffmpeg:', e)
        return
    }

    // 2. Create a dummy DB record
    console.log('Creating DB record...')
    const recording = await prisma.recording.create({
        data: {
            filePath: filename,
            startTime: new Date(),
            status: 'RECORDING'
        }
    })

    // 3. Run the metadata extraction logic (copied from recorder-service.ts)
    console.log('Running metadata extraction...')
    const endTime = new Date()
    let size = 0
    let duration = 0

    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath)
            size = stats.size
        }

        await new Promise<void>((resolve) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (!err && metadata && metadata.format && metadata.format.duration) {
                    duration = Math.round(metadata.format.duration)
                }
                resolve()
            })
        })
    } catch (e) {
        console.error('Error:', e)
    }

    console.log(`Captured - Size: ${size}, Duration: ${duration}`)

    // 4. Update DB
    await prisma.recording.update({
        where: { id: recording.id },
        data: {
            status: 'COMPLETED',
            endTime: endTime,
            size: size,
            duration: duration
        },
    })

    // 5. Verify
    const updated = await prisma.recording.findUnique({ where: { id: recording.id } })
    console.log('Final DB Record:', updated)

    if (updated?.size && updated.size > 0 && updated.duration === 2) {
        console.log('✅ SUCCESS: Metadata captured correctly')
    } else {
        console.error('❌ FAILURE: Metadata missing or incorrect')
    }

    // Cleanup
    fs.unlinkSync(filePath)
    await prisma.recording.delete({ where: { id: recording.id } })
}

testMetadataCapture()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())

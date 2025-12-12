import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { PassThrough } from 'stream'

const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const showId = searchParams.get('showId')

    if (!showId) {
        return NextResponse.json({ error: 'showId required' }, { status: 400 })
    }

    // Get show with settings
    const show = await prisma.show.findUnique({
        where: { id: showId },
        select: {
            id: true,
            title: true,
            feedEpisodeLimit: true,
            archivingEnabled: true,
        }
    })

    if (!show || !show.feedEpisodeLimit) {
        return NextResponse.json({ error: 'Show not found or no feed limit set' }, { status: 404 })
    }

    // Get all episodes for this show
    const allEpisodes = await prisma.episode.findMany({
        where: {
            recording: {
                scheduleSlot: {
                    showId: showId
                }
            }
        },
        orderBy: { publishedAt: 'desc' },
        include: {
            recording: true
        }
    })

    // Get archived episodes (beyond feed limit)
    const archivedEpisodes = allEpisodes.slice(show.feedEpisodeLimit)

    if (archivedEpisodes.length === 0) {
        return NextResponse.json({ error: 'No archived episodes found' }, { status: 404 })
    }

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 5 } })
    const passthrough = new PassThrough()

    archive.pipe(passthrough)

    // Add metadata.json
    const metadata = {
        exportDate: new Date().toISOString(),
        showTitle: show.title,
        showId: show.id,
        feedLimit: show.feedEpisodeLimit,
        episodes: archivedEpisodes.map(ep => ({
            id: ep.id,
            title: ep.title,
            description: ep.description,
            publishedAt: ep.publishedAt,
            duration: ep.duration,
            host: ep.host,
            tags: ep.tags,
            fileName: ep.recording?.filePath ? path.basename(ep.recording.filePath) : null
        }))
    }

    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' })

    // Add audio files
    for (const episode of archivedEpisodes) {
        if (episode.recording?.filePath) {
            const filePath = path.join(RECORDINGS_DIR, episode.recording.filePath)
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: path.basename(episode.recording.filePath) })
            }
        }
    }

    await archive.finalize()

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of passthrough) {
        chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Create safe filename
    const safeTitle = show.title.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${safeTitle}_archives.zip`

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
        }
    })
}

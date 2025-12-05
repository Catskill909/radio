import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Broadcasts now-playing changes to WebSocket clients
function broadcastNowPlaying(data: any) {
    const io = (global as any).io
    if (io) {
        io.to('now-playing').emit('now-playing:changed', data)
        console.log(`[WebSocket] Broadcast now-playing:changed - ${data.currentShow?.title || 'No show'}`)
    }
}

// Called by recorder-service when show transitions are detected
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // If explicit data provided, broadcast it
        if (body.currentShow !== undefined) {
            broadcastNowPlaying(body)
            return NextResponse.json({ success: true, message: 'Now playing broadcast sent' })
        }

        // Otherwise fetch current state and broadcast
        const now = new Date()

        const settings = await prisma.stationSettings.findUnique({
            where: { id: 'station' },
        })

        const currentSlot = await prisma.scheduleSlot.findFirst({
            where: {
                startTime: { lte: now },
                endTime: { gt: now },
            },
            include: {
                show: {
                    select: {
                        id: true,
                        title: true,
                        host: true,
                        image: true,
                    },
                },
            },
        })

        const nextSlot = await prisma.scheduleSlot.findFirst({
            where: {
                startTime: { gt: now },
            },
            include: {
                show: {
                    select: {
                        id: true,
                        title: true,
                        host: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        })

        const response = {
            stationInfo: {
                name: settings?.name || 'Radio Station',
                defaultArtwork: settings?.logoUrl || '/default-logo.png',
            },
            currentShow: currentSlot ? {
                id: currentSlot.show.id,
                title: currentSlot.show.title,
                host: currentSlot.show.host || 'Unknown Host',
                artwork: currentSlot.show.image || settings?.logoUrl,
                startTime: currentSlot.startTime.toISOString(),
                endTime: currentSlot.endTime.toISOString(),
            } : null,
            nextShow: nextSlot ? {
                id: nextSlot.show.id,
                title: nextSlot.show.title,
                host: nextSlot.show.host || 'Unknown Host',
                artwork: nextSlot.show.image || settings?.logoUrl,
                startTime: nextSlot.startTime.toISOString(),
            } : null,
        }

        broadcastNowPlaying(response)
        return NextResponse.json({ success: true, message: 'Now playing broadcast sent', data: response })
    } catch (error: any) {
        console.error('Now playing broadcast error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

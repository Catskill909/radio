import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch recent recording events for stats page (last 5 only - quick overview)
export async function GET() {
    try {
        // Get recent recordings (last 5) for quick stats overview
        const recordings = await prisma.recording.findMany({
            take: 5,
            orderBy: { startTime: 'desc' },
            include: {
                scheduleSlot: {
                    include: {
                        show: {
                            select: { title: true }
                        }
                    }
                }
            }
        })

        // Transform to event format for stats page
        const events = recordings.map(r => ({
            type: r.status === 'COMPLETED' ? 'completed'
                : r.status === 'RECORDING' ? 'started'
                    : r.status === 'FAILED' ? 'failed'
                        : 'started',
            showTitle: r.scheduleSlot?.show?.title || 'Unknown Show',
            slotId: r.scheduleSlotId,
            recordingId: r.id,
            timestamp: r.startTime
        }))

        return NextResponse.json({ events })
    } catch (error: any) {
        console.error('Failed to fetch recent recordings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recent recordings' },
            { status: 500 }
        )
    }
}

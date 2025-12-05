import { NextResponse } from 'next/server'

// Recording event types
type RecordingEventType = 'started' | 'completed' | 'failed'

interface RecordingEvent {
    type: RecordingEventType
    slotId: string
    recordingId?: string
    showTitle: string
    showId: string
    startTime?: string
    endTime?: string
    duration?: number
    error?: string
}

// Helper to broadcast recording events via WebSocket
function broadcastRecordingEvent(event: RecordingEvent) {
    const io = (global as any).io
    const activeRecordings = (global as any).activeRecordings

    // Track active recordings for late subscribers
    if (activeRecordings) {
        if (event.type === 'started' && event.slotId) {
            activeRecordings.set(event.slotId, {
                type: 'started',
                slotId: event.slotId,
                recordingId: event.recordingId,
                showTitle: event.showTitle,
                timestamp: new Date()
            })
        } else if ((event.type === 'completed' || event.type === 'failed') && event.slotId) {
            activeRecordings.delete(event.slotId)
        }
    }

    if (io) {
        io.to('recording-status').emit(`recording:${event.type}`, event)
        console.log(`[WebSocket] Broadcast recording:${event.type} for ${event.showTitle}`)
    }
}

export async function POST(request: Request) {
    try {
        const event: RecordingEvent = await request.json()

        // Validate required fields
        if (!event.type || !event.slotId || !event.showTitle) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: type, slotId, showTitle' },
                { status: 400 }
            )
        }

        // Broadcast to WebSocket clients
        broadcastRecordingEvent(event)

        return NextResponse.json({
            success: true,
            message: `Recording event '${event.type}' broadcast successfully`
        })
    } catch (error: any) {
        console.error('Recording event API error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process recording event' },
            { status: 500 }
        )
    }
}

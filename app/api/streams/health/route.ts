import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { testStream } from '@/lib/stream-tester'

export async function GET() {
    try {
        // Get all enabled streams
        const streams = await prisma.icecastStream.findMany({
            where: {
                isEnabled: true,
            },
        })

        // Test each stream and update status
        const healthChecks = await Promise.all(
            streams.map(async (stream) => {
                try {
                    const testResult = await testStream(stream.url)

                    // Update the stream in database
                    await prisma.icecastStream.update({
                        where: { id: stream.id },
                        data: {
                            status: testResult.status,
                            bitrate: testResult.bitrate,
                            format: testResult.format,
                            listeners: testResult.listeners,
                            maxListeners: testResult.maxListeners,
                            genre: testResult.genre,
                            description: testResult.description,
                            lastChecked: new Date(),
                            errorMessage: testResult.errorMessage,
                        },
                    })

                    return {
                        id: stream.id,
                        status: testResult.status,
                        errorMessage: testResult.errorMessage,
                        lastChecked: new Date().toISOString(),
                    }
                } catch (error: any) {
                    // If individual stream test fails, return error state
                    await prisma.icecastStream.update({
                        where: { id: stream.id },
                        data: {
                            status: 'error',
                            lastChecked: new Date(),
                            errorMessage: error.message || 'Health check failed',
                        },
                    })

                    return {
                        id: stream.id,
                        status: 'error',
                        errorMessage: error.message || 'Health check failed',
                        lastChecked: new Date().toISOString(),
                    }
                }
            })
        )

        // Also get all streams (including disabled) for complete state
        const allStreams = await prisma.icecastStream.findMany({
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({
            success: true,
            streams: allStreams,
            healthChecks,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('Stream health check error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to check stream health',
            },
            { status: 500 }
        )
    }
}

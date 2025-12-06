import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get only enabled streams
        const streams = await prisma.icecastStream.findMany({
            where: {
                isEnabled: true,
            },
            select: {
                id: true,
                name: true,
                url: true,
                status: true,
                bitrate: true,
                format: true,
                listeners: true,
                maxListeners: true,
                genre: true,
                description: true,
                lastChecked: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Get the active stream URL from settings
        const settings = await prisma.stationSettings.findUnique({
            where: { id: 'station' },
            select: { streamUrl: true },
        });

        return NextResponse.json({
            activeStreamUrl: settings?.streamUrl || null,
            streams: streams.map((stream) => ({
                ...stream,
                isActive: stream.url === settings?.streamUrl,
            })),
        });
    } catch (error) {
        console.error('Error fetching streams:', error);
        return NextResponse.json(
            { error: 'Failed to fetch streams' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination parameters
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');
        const sort = searchParams.get('sort') || 'recent';

        // Filter parameters
        const status = searchParams.get('status'); // COMPLETED, RECORDING, FAILED, PENDING
        const showId = searchParams.get('showId');

        // Build where clause - only show completed recordings publicly
        const where: any = {
            status: status || 'COMPLETED',
        };
        if (showId) {
            where.scheduleSlot = { showId };
        }

        // Build orderBy
        let orderBy: any;
        switch (sort) {
            case 'oldest':
                orderBy = { startTime: 'asc' };
                break;
            case 'recent':
            default:
                orderBy = { startTime: 'desc' };
        }

        // Get total count
        const total = await prisma.recording.count({ where });

        // Get recordings
        const recordings = await prisma.recording.findMany({
            where,
            orderBy,
            skip: offset,
            take: limit,
            include: {
                scheduleSlot: {
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
                },
                episode: {
                    select: {
                        id: true,
                        title: true,
                        publishedAt: true,
                    },
                },
            },
        });

        return NextResponse.json({
            data: recordings.map((rec) => ({
                id: rec.id,
                status: rec.status,
                startTime: rec.startTime?.toISOString(),
                endTime: rec.endTime?.toISOString(),
                duration: rec.startTime && rec.endTime
                    ? Math.round((rec.endTime.getTime() - rec.startTime.getTime()) / 1000 / 60)
                    : null,
                show: rec.scheduleSlot?.show || null,
                episode: rec.episode ? {
                    id: rec.episode.id,
                    title: rec.episode.title,
                    publishedAt: rec.episode.publishedAt?.toISOString(),
                } : null,
                quality: {
                    codec: (rec as any).audioCodec,
                    bitrate: (rec as any).audioBitrate,
                    sampleRate: (rec as any).audioSampleRate,
                },
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + recordings.length < total,
            },
        });
    } catch (error) {
        console.error('Error fetching recordings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recordings' },
            { status: 500 }
        );
    }
}

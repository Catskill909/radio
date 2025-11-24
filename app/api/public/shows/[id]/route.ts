import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        // Fetch show
        const show = await prisma.show.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                host: true,
                type: true,
                description: true,
                image: true,
                tags: true,
                category: true,
                explicit: true,
            },
        });

        if (!show) {
            return NextResponse.json(
                { error: 'Show not found' },
                { status: 404 }
            );
        }

        // Fetch published episodes
        const recordings = await prisma.recording.findMany({
            where: {
                scheduleSlot: {
                    showId: id,
                },
                status: 'COMPLETED',
            },
            include: {
                episode: true,
            },
            orderBy: {
                startTime: 'desc',
            },
            take: 10,
        });

        const episodes = recordings
            .filter(rec => rec.episode && rec.episode.publishedAt)
            .map(rec => ({
                id: rec.episode!.id,
                title: rec.episode!.title,
                publishedAt: rec.episode!.publishedAt!.toISOString(),
                duration: rec.episode!.duration || 0,
                audioPath: rec.filePath,
                coverImage: rec.episode!.imageUrl || show.image || '',
            }));

        // Get schedule info
        const scheduleSlots = await prisma.scheduleSlot.findMany({
            where: {
                showId: id,
                startTime: { gte: new Date() },
            },
            orderBy: {
                startTime: 'asc',
            },
            take: 1,
        });

        let recurrence = '';
        if (scheduleSlots.length > 0) {
            const slot = scheduleSlots[0];
            const dayOfWeek = slot.startTime.toLocaleDateString('en-US', { weekday: 'long' });
            const time = slot.startTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            recurrence = `Airs ${dayOfWeek}s at ${time}`;
        }

        return NextResponse.json({
            show: {
                ...show,
                tags: show.tags ? show.tags.split(',') : [],
                rssFeedUrl: `/api/feed/show/${id}`,
            },
            episodes,
            schedule: {
                recurrence,
            },
        });
    } catch (error) {
        console.error('Error fetching show details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch show details' },
            { status: 500 }
        );
    }
}

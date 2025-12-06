import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get the correct base URL, checking reverse proxy headers
function getBaseUrl(request: NextRequest): string {
    // 1. Check X-Forwarded-Host (set by reverse proxy like nginx/Coolify)
    const forwardedHost = request.headers.get('x-forwarded-host');
    if (forwardedHost) {
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        return `${protocol}://${forwardedHost}`;
    }

    // 2. Check Host header
    const host = request.headers.get('host');
    if (host && !host.includes('localhost')) {
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        return `${protocol}://${host}`;
    }

    // 3. Fall back to request origin (works in development)
    return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination parameters
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const baseUrl = getBaseUrl(request);

        // Get total count
        const total = await prisma.show.count();

        // Get shows with episode counts
        const shows = await prisma.show.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                host: true,
                description: true,
                image: true,
                category: true,
                type: true,
                explicit: true,
                language: true,
            },
        });

        // Get episode counts and latest episodes for each show
        const showsWithEpisodes = await Promise.all(
            shows.map(async (show) => {
                // Count episodes for this show
                const episodeCount = await prisma.episode.count({
                    where: {
                        publishedAt: { not: null },
                        recording: {
                            scheduleSlot: {
                                showId: show.id,
                            },
                        },
                    },
                });

                // Get latest episode
                const latestEpisode = await prisma.episode.findFirst({
                    where: {
                        publishedAt: { not: null },
                        recording: {
                            scheduleSlot: {
                                showId: show.id,
                            },
                        },
                    },
                    orderBy: { publishedAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        publishedAt: true,
                        duration: true,
                    },
                });

                return {
                    id: show.id,
                    title: show.title,
                    host: show.host,
                    description: show.description,
                    image: show.image,
                    category: show.category,
                    type: show.type,
                    explicit: show.explicit,
                    language: show.language || 'en',
                    episodeCount,
                    rssFeedUrl: `${baseUrl}/api/feed/show/${show.id}`,
                    latestEpisode: latestEpisode ? {
                        id: latestEpisode.id,
                        title: latestEpisode.title,
                        publishedAt: latestEpisode.publishedAt?.toISOString(),
                        duration: latestEpisode.duration,
                    } : null,
                };
            })
        );

        return NextResponse.json({
            data: showsWithEpisodes,
            globalFeedUrl: `${baseUrl}/api/feed`,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + shows.length < total,
            },
        });
    } catch (error) {
        console.error('Error fetching podcasts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch podcasts' },
            { status: 500 }
        );
    }
}

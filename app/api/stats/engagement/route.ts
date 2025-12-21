/**
 * Admin API: Get Engagement Statistics
 * 
 * GET /api/stats/engagement?range=7d|30d|90d|all
 * 
 * Returns engagement statistics for the stats dashboard:
 * - Overview: total shows, episodes, plays
 * - Trends: daily play counts for charting
 * - Top Episodes: ranked by play count
 * - Top Shows: ranked by total plays
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';
        const showFilter = searchParams.get('showId') || undefined;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (range) {
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
            case '7d':
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
        }

        // Build where clause for plays
        const playWhere: any = {
            playedAt: { gte: startDate }
        };
        if (showFilter) {
            playWhere.showId = showFilter;
        }

        // Get overview counts
        const [totalShows, totalEpisodes, totalPlays] = await Promise.all([
            prisma.show.count(),
            prisma.episode.count(),
            prisma.episodePlay.count({ where: playWhere })
        ]);

        // Get unique listeners (approximated by unique userAgent+sessionId combinations)
        const uniqueListenersResult = await prisma.episodePlay.groupBy({
            by: ['userAgent', 'sessionId'],
            where: playWhere,
        });
        const uniqueListeners = uniqueListenersResult.length;

        // Get daily trends for chart
        const plays = await prisma.episodePlay.findMany({
            where: playWhere,
            select: {
                playedAt: true,
            },
            orderBy: { playedAt: 'asc' }
        });

        // Aggregate plays by day
        const trendsMap = new Map<string, { plays: number; listeners: Set<string> }>();
        plays.forEach(play => {
            const dateKey = play.playedAt.toISOString().split('T')[0];
            if (!trendsMap.has(dateKey)) {
                trendsMap.set(dateKey, { plays: 0, listeners: new Set() });
            }
            const day = trendsMap.get(dateKey)!;
            day.plays++;
        });

        const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
            date,
            plays: data.plays,
        }));

        // Get top episodes by play count
        const topEpisodesRaw = await prisma.episodePlay.groupBy({
            by: ['episodeId'],
            where: playWhere,
            _count: { episodeId: true },
            orderBy: { _count: { episodeId: 'desc' } },
            take: 10
        });

        // Fetch episode details
        const episodeIds = topEpisodesRaw.map(e => e.episodeId);
        const episodes = await prisma.episode.findMany({
            where: { id: { in: episodeIds } },
            include: {
                recording: {
                    include: {
                        scheduleSlot: {
                            include: { show: true }
                        }
                    }
                }
            }
        });

        const episodeMap = new Map(episodes.map(e => [e.id, e]));
        const topEpisodes = topEpisodesRaw.map(raw => {
            const episode = episodeMap.get(raw.episodeId);
            return {
                id: raw.episodeId,
                title: episode?.title || 'Unknown Episode',
                showTitle: episode?.recording?.scheduleSlot?.show?.title || 'Unknown Show',
                showId: episode?.recording?.scheduleSlot?.show?.id,
                plays: raw._count.episodeId,
            };
        });

        // Get top shows by play count
        const topShowsRaw = await prisma.episodePlay.groupBy({
            by: ['showId'],
            where: playWhere,
            _count: { showId: true },
            orderBy: { _count: { showId: 'desc' } },
            take: 10
        });

        // Fetch show details with episode counts
        const showIds = topShowsRaw.map(s => s.showId);
        const shows = await prisma.show.findMany({
            where: { id: { in: showIds } },
            include: {
                _count: {
                    select: {
                        slots: {
                            where: {
                                recordings: {
                                    some: {
                                        episode: { isNot: null }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const showMap = new Map(shows.map(s => [s.id, s]));
        const topShows = topShowsRaw.map(raw => {
            const show = showMap.get(raw.showId);
            return {
                id: raw.showId,
                title: show?.title || 'Unknown Show',
                plays: raw._count.showId,
                episodes: show?._count?.slots || 0,
            };
        });

        // Get all shows for filter dropdown
        const allShows = await prisma.show.findMany({
            select: { id: true, title: true },
            orderBy: { title: 'asc' }
        });

        return NextResponse.json({
            overview: {
                totalShows,
                totalEpisodes,
                totalPlays,
                uniqueListeners,
            },
            trends,
            topEpisodes,
            topShows,
            shows: allShows, // For filter dropdown
            range,
        });
    } catch (error) {
        console.error('Error fetching engagement stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch engagement stats' },
            { status: 500 }
        );
    }
}

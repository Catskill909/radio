import { NextRequest, NextResponse } from "next/server";
import RSS from "rss";
import { prisma } from "@/lib/prisma";

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
    // Fetch station settings for feed metadata
    const stationSettings = await prisma.stationSettings.findUnique({
        where: { id: "station" },
    });

    // Fetch all published episodes
    const allEpisodes = await prisma.episode.findMany({
        where: {
            publishedAt: { not: null },
        },
        include: {
            recording: {
                include: {
                    scheduleSlot: {
                        include: {
                            show: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            publishedAt: "desc",
        },
    });

    // Apply per-show episode limits
    // Group episodes by show and limit based on feedEpisodeLimit
    const showEpisodeCounts = new Map<string, number>();
    const episodes = allEpisodes.filter((episode) => {
        const show = episode.recording.scheduleSlot?.show;
        if (!show) return true; // Include orphaned episodes

        const showId = show.id;
        const currentCount = showEpisodeCounts.get(showId) || 0;
        const limit = show.feedEpisodeLimit;

        // If no limit set, include all episodes
        if (!limit) {
            showEpisodeCounts.set(showId, currentCount + 1);
            return true;
        }

        // If under limit, include and increment count
        if (currentCount < limit) {
            showEpisodeCounts.set(showId, currentCount + 1);
            return true;
        }

        // Over limit, exclude
        return false;
    });

    const baseUrl = getBaseUrl(request);

    // Helper to ensure absolute URLs
    const getAbsoluteUrl = (path: string | null) => {
        if (!path) return undefined;
        if (path.startsWith("http")) return path;
        return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    };

    const feedTitle = stationSettings?.name || "StationDock Podcast";
    const feedDescription = stationSettings?.description || "All episodes from StationDock";
    const feedImage = getAbsoluteUrl(stationSettings?.logoUrl || null);

    // Create RSS feed
    const feed = new RSS({
        title: feedTitle,
        description: feedDescription,
        feed_url: `${baseUrl}/api/feed`,
        site_url: baseUrl,
        language: "en",
        pubDate: new Date(),
        ttl: 60,
        image_url: feedImage,
        custom_namespaces: {
            itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
        },
        custom_elements: [
            { "itunes:author": stationSettings?.name || "StationDock" },
            { "itunes:summary": feedDescription },
            ...(feedImage ? [{ "itunes:image": { _attr: { href: feedImage } } }] : []),
        ],
    });

    // Add episodes to feed
    episodes.forEach((episode) => {
        const audioUrl = `${baseUrl}/api/audio/${episode.recording.filePath}`;
        const show = episode.recording.scheduleSlot?.show;

        // Episode image with fallback to show image, then station logo
        const episodeImage = getAbsoluteUrl((episode as any).imageUrl) ||
            getAbsoluteUrl(show?.image || null) ||
            feedImage;

        feed.item({
            title: episode.title,
            description: episode.description || "",
            url: `${baseUrl}/episodes/${episode.id}`,
            guid: episode.id,
            date: episode.publishedAt || episode.createdAt,
            enclosure: {
                url: audioUrl,
                type: "audio/mpeg",
                size: (episode.recording as any).size || 0,
            },
            custom_elements: [
                { "itunes:author": (episode as any).host || show?.host || show?.author || stationSettings?.name || "StationDock" },
                { "itunes:duration": (episode as any).duration || 0 },
                ...(episodeImage ? [{ "itunes:image": { _attr: { href: episodeImage } } }] : []),
            ],
        });
    });

    const xml = feed.xml({ indent: true });

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
        },
    });
}

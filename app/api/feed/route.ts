import { NextResponse } from "next/server";
import RSS from "rss";
import { prisma } from "@/lib/prisma";

export async function GET() {
    // Fetch station settings for feed metadata
    const stationSettings = await prisma.stationSettings.findUnique({
        where: { id: "station" },
    });

    // Fetch all published episodes
    const episodes = await prisma.episode.findMany({
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

    // Helper to ensure absolute URLs
    const getAbsoluteUrl = (path: string | null) => {
        if (!path) return undefined;
        if (path.startsWith("http")) return path;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    };

    const feedTitle = stationSettings?.name || "Radio Suite Podcast";
    const feedDescription = stationSettings?.description || "All episodes from Radio Suite";
    const feedImage = getAbsoluteUrl(stationSettings?.logoUrl || null);

    // Create RSS feed
    const feed = new RSS({
        title: feedTitle,
        description: feedDescription,
        feed_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/feed`,
        site_url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        language: "en",
        pubDate: new Date(),
        ttl: 60,
        image_url: feedImage,
        custom_namespaces: {
            itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
        },
        custom_elements: [
            { "itunes:author": stationSettings?.name || "Radio Suite" },
            { "itunes:summary": feedDescription },
            ...(feedImage ? [{ "itunes:image": { _attr: { href: feedImage } } }] : []),
        ],
    });

    // Add episodes to feed
    episodes.forEach((episode) => {
        const audioUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/audio/${episode.recording.filePath}`;
        const show = episode.recording.scheduleSlot?.show;

        // Episode image with fallback to show image, then station logo
        const episodeImage = getAbsoluteUrl((episode as any).imageUrl) ||
            getAbsoluteUrl(show?.image || null) ||
            feedImage;

        feed.item({
            title: episode.title,
            description: episode.description || "",
            url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/episodes/${episode.id}`,
            guid: episode.id,
            date: episode.publishedAt || episode.createdAt,
            enclosure: {
                url: audioUrl,
                type: "audio/mpeg",
                size: (episode.recording as any).size || 0,
            },
            custom_elements: [
                { "itunes:author": (episode as any).host || show?.host || show?.author || stationSettings?.name || "Radio Suite" },
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

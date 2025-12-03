import { NextRequest, NextResponse } from "next/server";
import RSS from "rss";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ showId: string }> }
) {
    const showId = (await params).showId;

    // Fetch the show
    const show = await prisma.show.findUnique({
        where: { id: showId },
    });

    if (!show) {
        return new NextResponse("Show not found", { status: 404 });
    }

    // Fetch station settings for fallback metadata
    const stationSettings = await prisma.stationSettings.findUnique({
        where: { id: "station" },
    });

    // Fetch episodes for this show
    const episodes = await prisma.episode.findMany({
        where: {
            publishedAt: { not: null },
            recording: {
                scheduleSlot: {
                    showId: showId,
                },
            },
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

    // Use show image with station logo as fallback
    const showImage = getAbsoluteUrl(show.image) || getAbsoluteUrl(stationSettings?.logoUrl || null);

    // Fallback metadata helper
    const authorName = show.author || show.host || stationSettings?.name || "Radio Suite";
    const ownerEmail = show.email || stationSettings?.email || "podcasts@radiosuite.com";

    // Create RSS feed
    const feed = new RSS({
        title: show.title,
        description: show.description || `Episodes from ${show.title}`,
        feed_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/feed/show/${showId}`,
        site_url: show.link || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        language: show.language || "en",
        pubDate: new Date(),
        ttl: 60,
        image_url: showImage,
        custom_namespaces: {
            itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
        },
        custom_elements: [
            { "itunes:author": authorName },
            { "itunes:summary": show.description || "" },
            { "itunes:category": { _attr: { text: show.category || show.type } } },
            {
                "itunes:owner": [
                    { "itunes:name": authorName },
                    { "itunes:email": ownerEmail }
                ]
            },
            { "itunes:explicit": show.explicit ? "yes" : "no" },
            ...(show.tags ? [{ "itunes:keywords": show.tags }] : []),
            ...(showImage ? [{ "itunes:image": { _attr: { href: showImage } } }] : []),
        ],
    });

    // Add episodes to feed
    episodes.forEach((episode) => {
        const audioUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/audio/${episode.recording.filePath}`;
        const episodeImage = getAbsoluteUrl((episode as any).imageUrl) || showImage;

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
                { "itunes:author": (episode as any).host || show.host || "Radio Suite" },
                { "itunes:duration": (episode as any).duration || 0 },
                { "itunes:explicit": "no" },
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

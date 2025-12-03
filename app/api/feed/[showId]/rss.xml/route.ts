import { prisma } from "@/lib/prisma";
import RSS from "rss";
import { NextRequest, NextResponse } from "next/server";
import { parseCategory } from "@/lib/itunes-categories";

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
        return `${request.nextUrl.origin}${path.startsWith("/") ? "" : "/"}${path}`;
    };

    // Use show image with station logo as fallback
    const showImage = getAbsoluteUrl(show.image) || getAbsoluteUrl(stationSettings?.logoUrl || null);

    // Fallback metadata helper
    const authorName = show.author || show.host || stationSettings?.name || "Radio Suite";
    const ownerEmail = show.email || stationSettings?.email || "podcasts@radiosuite.com";

    // Parse category for nested structure
    const { category, subcategory } = parseCategory(show.category);
    let itunesCategory;

    if (category && subcategory) {
        itunesCategory = {
            "itunes:category": [
                { _attr: { text: category } },
                { "itunes:category": { _attr: { text: subcategory } } }
            ]
        };
    } else {
        itunesCategory = {
            "itunes:category": {
                _attr: { text: category || show.type || "Music" }
            }
        };
    }

    const feed = new RSS({
        title: show.title,
        description: show.description || "",
        feed_url: `${request.nextUrl.origin}/api/feed/${show.id}/rss.xml`,
        site_url: show.link || `${request.nextUrl.origin}/shows/${show.id}`,
        image_url: showImage,
        language: show.language || "en-us",
        copyright: show.copyright || undefined,
        pubDate: new Date(),
        custom_namespaces: {
            'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
        },
        custom_elements: [
            { 'itunes:author': authorName },
            { 'itunes:subtitle': show.description?.substring(0, 255) || "" },
            { 'itunes:summary': show.description || "" },
            {
                'itunes:owner': [
                    { 'itunes:name': authorName },
                    { 'itunes:email': ownerEmail }
                ]
            },
            { 'itunes:explicit': show.explicit ? 'yes' : 'no' },
            itunesCategory,
            { 'itunes:type': show.itunesType || 'episodic' },
            { 'itunes:keywords': show.tags || "" }
        ]
    });

    episodes.forEach((episode) => {
        if (episode.recording) {
            feed.item({
                title: episode.title,
                description: episode.description || "",
                url: `${request.nextUrl.origin}/episodes/${episode.id}`,
                date: episode.publishedAt || episode.createdAt,
                enclosure: {
                    url: getAbsoluteUrl(episode.recording.filePath) || "",
                    type: "audio/mpeg",
                    size: episode.recording.size || 0
                },
                custom_elements: [
                    { 'itunes:duration': episode.duration || episode.recording.duration },
                    { 'itunes:author': episode.host || show.host },
                    { 'itunes:image': { _attr: { href: getAbsoluteUrl(episode.imageUrl) || showImage } } },
                    { 'itunes:keywords': episode.tags }
                ]
            });
        }
    });

    const xml = feed.xml({ indent: true });

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
        },
    });
}

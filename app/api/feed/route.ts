import { NextResponse } from "next/server";
import RSS from "rss";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Create RSS feed
    const feed = new RSS({
        title: "Radio Suite Podcast",
        description: "All episodes from Radio Suite",
        feed_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/feed`,
        site_url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        language: "en",
        pubDate: new Date(),
        ttl: 60,
    });

    // Add episodes to feed
    episodes.forEach((episode) => {
        const audioUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/audio/${episode.recording.filePath}`;

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
                { "itunes:author": (episode as any).host || "Radio Suite" },
                { "itunes:duration": (episode as any).duration || 0 },
                ...((episode as any).imageUrl ? [{ "itunes:image": { _attr: { href: (episode as any).imageUrl } } }] : []),
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

import { prisma } from "@/lib/prisma";
import RSS from "rss";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ showId: string }> }
) {
    const { showId } = await params;
    const show = await prisma.show.findUnique({
        where: { id: showId },
        include: {
            slots: {
                include: {
                    recordings: {
                        include: {
                            episode: true,
                        },
                        where: {
                            status: "COMPLETED",
                            episode: {
                                isNot: null,
                            },
                        },
                    },
                },
            },
        },
    });

    if (!show) {
        return new NextResponse("Show not found", { status: 404 });
    }

    const feed = new RSS({
        title: show.title,
        description: show.description || "",
        feed_url: `${request.nextUrl.origin}/api/feed/${show.id}/rss.xml`,
        site_url: `${request.nextUrl.origin}/shows/${show.id}`,
        image_url: show.image || undefined,
        language: "en",
        pubDate: new Date(),
        custom_namespaces: {
            'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
        },
    });

    // Flatten recordings from slots
    const recordings = show.slots.flatMap((slot: any) => slot.recordings);

    // Sort by creation date desc
    recordings.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    recordings.forEach((recording: any) => {
        if (recording.episode) {
            feed.item({
                title: recording.episode.title,
                description: recording.episode.description || "",
                url: `${request.nextUrl.origin}/episodes/${recording.episode.id}`,
                date: recording.episode.publishedAt || recording.createdAt,
                enclosure: {
                    url: `${request.nextUrl.origin}/recordings/${recording.filePath}`,
                    type: "audio/mpeg",
                    size: recording.size || 0
                },
                custom_elements: [
                    { 'itunes:duration': recording.episode.duration || recording.duration },
                    { 'itunes:author': recording.episode.host || show.host },
                    { 'itunes:image': { _attr: { href: recording.episode.imageUrl || show.image } } },
                    { 'itunes:keywords': recording.episode.tags }
                ]
            });
        }
    });

    return new NextResponse(feed.xml({ indent: true }), {
        headers: {
            "Content-Type": "application/xml",
        },
    });
}

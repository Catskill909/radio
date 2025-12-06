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
        const type = searchParams.get('type');
        const host = searchParams.get('host');

        // Build where clause
        const where: any = {};
        if (type) where.type = type;
        if (host) where.host = { contains: host };

        // Build orderBy
        let orderBy: any;
        switch (sort) {
            case 'oldest':
                orderBy = { createdAt: 'asc' };
                break;
            case 'alphabetical':
                orderBy = { title: 'asc' };
                break;
            case 'recent':
            default:
                orderBy = { createdAt: 'desc' };
        }

        // Get total count
        const total = await prisma.show.count({ where });

        // Get shows
        const shows = await prisma.show.findMany({
            where,
            orderBy,
            skip: offset,
            take: limit,
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
                createdAt: true,
            },
        });

        return NextResponse.json({
            data: shows.map((show) => ({
                ...show,
                tags: show.tags ? show.tags.split(',').map((t: string) => t.trim()) : [],
                rssFeedUrl: `/api/feed/show/${show.id}`,
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + shows.length < total,
            },
        });
    } catch (error) {
        console.error('Error fetching shows:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shows' },
            { status: 500 }
        );
    }
}

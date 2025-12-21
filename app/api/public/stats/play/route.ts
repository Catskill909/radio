/**
 * Public API: Track Episode Play
 * 
 * POST /api/public/stats/play
 * Body: { episodeId: string, showId: string, sessionId?: string }
 * 
 * Records when an episode starts playing from the public /listen page.
 * This endpoint is public (no auth required) to allow tracking from the listen page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { episodeId, showId, sessionId } = body;

        if (!episodeId || !showId) {
            return NextResponse.json(
                { success: false, error: 'episodeId and showId are required' },
                { status: 400 }
            );
        }

        // Get user agent for unique listener estimation
        const userAgent = request.headers.get('user-agent') || undefined;

        // Record the play
        await prisma.episodePlay.create({
            data: {
                episodeId,
                showId,
                userAgent,
                sessionId: sessionId || undefined,
            }
        });

        // Update daily stats (upsert for today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.playStats.upsert({
            where: { date: today },
            create: {
                date: today,
                totalPlays: 1,
                uniqueListeners: 1, // Will be recalculated in aggregation
            },
            update: {
                totalPlays: { increment: 1 },
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error tracking play:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to track play' },
            { status: 500 }
        );
    }
}

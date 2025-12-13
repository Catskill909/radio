/**
 * ACRCloud Song Identification API Route
 * 
 * POST /api/acrcloud/identify
 * Body: { streamUrl: string }
 * 
 * Captures audio from the given stream URL and identifies the song
 * using ACRCloud's audio fingerprinting service.
 * 
 * Includes usage tracking and monthly limit enforcement for cost protection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { identifySong } from '@/lib/acrcloud';
import { prisma } from '@/lib/prisma';

// Helper to check if we're in a new month
function isNewMonth(lastResetDate: Date | null): boolean {
    if (!lastResetDate) return true;
    const now = new Date();
    return (
        now.getMonth() !== lastResetDate.getMonth() ||
        now.getFullYear() !== lastResetDate.getFullYear()
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { streamUrl } = body;

        if (!streamUrl) {
            return NextResponse.json(
                { success: false, error: 'Stream URL is required' },
                { status: 400 }
            );
        }

        // Get settings from database
        // Note: Using 'as any' to work around IDE TypeScript caching
        const settings = await prisma.stationSettings.findUnique({
            where: { id: 'station' }
        }) as any;

        // Check usage limits
        const monthlyLimit = settings?.acrcloudMonthlyLimit ?? 500;
        let requestCount = settings?.acrcloudRequestCount ?? 0;
        const resetDate = settings?.acrcloudResetDate;

        // Reset counter if new month
        if (isNewMonth(resetDate)) {
            requestCount = 0;
            await (prisma.stationSettings.update as any)({
                where: { id: 'station' },
                data: {
                    acrcloudRequestCount: 0,
                    acrcloudResetDate: new Date()
                }
            });
        }

        // Check if limit reached
        if (requestCount >= monthlyLimit) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Monthly limit reached (${requestCount}/${monthlyLimit} requests). Increase limit in Settings or wait until next month.`,
                    limitReached: true,
                    usage: { count: requestCount, limit: monthlyLimit }
                },
                { status: 429 }
            );
        }

        // Priority: environment variables > database settings
        const credentials = {
            host: process.env.ACRCLOUD_HOST || settings?.acrcloudHost || '',
            accessKey: process.env.ACRCLOUD_ACCESS_KEY || settings?.acrcloudAccessKey || '',
            accessSecret: process.env.ACRCLOUD_ACCESS_SECRET || settings?.acrcloudAccessSecret || '',
        };

        // Check if credentials are configured
        if (!credentials.host || !credentials.accessKey || !credentials.accessSecret) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ACRCloud credentials not configured. Enter your API keys in Settings or set environment variables.'
                },
                { status: 400 }
            );
        }

        // Look up stream bitrate from database for optimal capture
        let streamBitrate: number | undefined;
        try {
            const stream = await prisma.icecastStream.findFirst({
                where: { url: streamUrl },
                select: { bitrate: true, name: true }
            });

            if (stream?.bitrate) {
                streamBitrate = stream.bitrate;
                console.log(`🔍 Found stream "${stream.name}" with bitrate: ${streamBitrate}kbps`);
            } else {
                console.log(`⚠️  Stream bitrate unknown, using default (128kbps)`);
            }
        } catch (error) {
            console.log(`⚠️  Could not query stream bitrate, using default (128kbps)`);
        }

        // Identify the song (with optional bitrate for optimal capture)
        const result = await identifySong(streamUrl, credentials, streamBitrate);

        // Increment request counter (only if API call was made)
        await (prisma.stationSettings.update as any)({
            where: { id: 'station' },
            data: {
                acrcloudRequestCount: requestCount + 1,
                acrcloudResetDate: settings?.acrcloudResetDate || new Date()
            }
        });

        // Include usage info in response
        return NextResponse.json({
            ...result,
            usage: { count: requestCount + 1, limit: monthlyLimit }
        });

    } catch (error) {
        console.error('ACRCloud API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to identify song'
            },
            { status: 500 }
        );
    }
}

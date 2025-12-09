/**
 * ACRCloud Song Identification API Route
 * 
 * POST /api/acrcloud/identify
 * Body: { streamUrl: string }
 * 
 * Captures audio from the given stream URL and identifies the song
 * using ACRCloud's audio fingerprinting service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { identifySong } from '@/lib/acrcloud';
import { prisma } from '@/lib/prisma';

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

        // Identify the song
        const result = await identifySong(streamUrl, credentials);

        return NextResponse.json(result);

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

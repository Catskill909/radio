import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.stationSettings.findUnique({
            where: { id: 'station' },
        });

        if (!settings) {
            return NextResponse.json({
                name: 'Radio Station',
                description: '',
                email: '',
                timezone: 'America/New_York',
                logoUrl: null,
                streamUrl: null,
            });
        }

        return NextResponse.json({
            name: settings.name || 'Radio Station',
            description: settings.description || '',
            email: settings.email || '',
            timezone: settings.timezone || 'America/New_York',
            logoUrl: settings.logoUrl,
            streamUrl: settings.streamUrl,
            // Site branding
            siteLogo: settings.siteLogo,
            siteTitle: settings.siteTitle,
            siteTagline: settings.siteTagline,
            showSiteLogo: settings.showSiteLogo ?? true,
            showSiteTitle: settings.showSiteTitle ?? true,
            showSiteTagline: settings.showSiteTagline ?? true,
        });
    } catch (error) {
        console.error('Error fetching station settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch station settings' },
            { status: 500 }
        );
    }
}

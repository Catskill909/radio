import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toZonedTime } from 'date-fns-tz';
import { differenceInMinutes } from 'date-fns';

export async function GET() {
    try {
        // Get station settings
        const settings = await prisma.stationSettings.findUnique({
            where: { id: 'station' },
        });
        const timezone = settings?.timezone || 'America/New_York';

        // Get current time in station timezone
        const now = toZonedTime(new Date(), timezone);

        // Find current show
        const currentSlot = await prisma.scheduleSlot.findFirst({
            where: {
                startTime: { lte: now },
                endTime: { gt: now },
            },
            include: {
                show: {
                    select: {
                        id: true,
                        title: true,
                        host: true,
                        type: true,
                        image: true,
                    },
                },
            },
        });

        // Find next show
        const nextSlot = await prisma.scheduleSlot.findFirst({
            where: {
                startTime: { gt: now },
            },
            include: {
                show: {
                    select: {
                        id: true,
                        title: true,
                        host: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        const response: any = {
            stationInfo: {
                name: settings?.name || 'Radio Station',
                tagline: settings?.description || '',
                defaultArtwork: settings?.logoUrl || '/default-logo.png',
            },
            currentShow: null,
            nextShow: null,
        };

        if (currentSlot) {
            const timeRemaining = differenceInMinutes(currentSlot.endTime, now);
            response.currentShow = {
                id: currentSlot.show.id,
                title: currentSlot.show.title,
                host: currentSlot.show.host || 'Unknown Host',
                artwork: currentSlot.show.image || response.stationInfo.defaultArtwork,
                startTime: currentSlot.startTime.toISOString(),
                endTime: currentSlot.endTime.toISOString(),
                timeRemaining,
            };
        }

        if (nextSlot) {
            response.nextShow = {
                id: nextSlot.show.id,
                title: nextSlot.show.title,
                host: nextSlot.show.host || 'Unknown Host',
                artwork: nextSlot.show.image || response.stationInfo.defaultArtwork,
                startTime: nextSlot.startTime.toISOString(),
            };
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching now playing:', error);
        return NextResponse.json(
            { error: 'Failed to fetch now playing data' },
            { status: 500 }
        );
    }
}

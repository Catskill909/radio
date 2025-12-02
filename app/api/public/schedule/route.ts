import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startParam = searchParams.get('start');
        const endParam = searchParams.get('end');

        // Get station settings for timezone
        const settings = await prisma.stationSettings.findUnique({
            where: { id: 'station' },
        });
        const timezone = settings?.timezone || 'America/New_York';

        // Parse dates as UTC (database stores UTC)
        let startDate: Date;
        let endDate: Date;

        if (startParam && endParam) {
            // Client sends ISO strings - parse them as-is (they're already UTC)
            startDate = new Date(startParam);
            endDate = new Date(endParam);
        } else {
            // Default to current day in UTC
            const now = new Date();
            startDate = startOfDay(now);
            endDate = endOfDay(addDays(now, 6));
        }

        // Fetch schedule slots within date range
        const slots = await prisma.scheduleSlot.findMany({
            where: {
                startTime: {
                    gte: startDate,
                    lt: endDate, // FIX: Use 'lt' instead of 'lte' to exclude midnight of the next day
                },
            },
            include: {
                show: {
                    select: {
                        id: true,
                        title: true,
                        host: true,
                        type: true,
                        image: true,
                        description: true,
                        tags: true,
                        category: true,
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        return NextResponse.json({
            stationTimezone: timezone,
            slots: slots.map((slot: any) => ({
                id: slot.id,
                showId: slot.showId,
                startTime: slot.startTime.toISOString(),
                endTime: slot.endTime.toISOString(),
                show: {
                    ...slot.show,
                    tags: slot.show.tags ? slot.show.tags.split(',') : [],
                },
            })),
        });
    } catch (error) {
        console.error('Error fetching public schedule:', error);
        return NextResponse.json(
            { error: 'Failed to fetch schedule' },
            { status: 500 }
        );
    }
}

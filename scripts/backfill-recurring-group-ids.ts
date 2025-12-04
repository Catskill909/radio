import { prisma } from '../lib/prisma';
import { utcToStationTime } from '../lib/station-time';

/**
 * Backfill recurringGroupId for existing recurring shows.
 * 
 * This script groups existing recurring slots by:
 * - showId
 * - day of week (in station timezone)
 * - time of day (in station timezone)
 * 
 * Each group is assigned a unique recurringGroupId.
 */
async function backfillRecurringGroupIds() {
    console.log('Starting backfill of recurringGroupId for existing recurring shows...\n');

    // Get all recurring slots
    const recurringSlots = await prisma.scheduleSlot.findMany({
        where: { isRecurring: true },
        include: { show: true },
        orderBy: [{ showId: 'asc' }, { startTime: 'asc' }]
    });

    console.log(`Found ${recurringSlots.length} recurring slots to process\n`);

    if (recurringSlots.length === 0) {
        console.log('No recurring slots found. Nothing to backfill.');
        return;
    }

    // Group slots by showId, day-of-week, and time-of-day (in station timezone)
    const groups = new Map<string, Array<{ id: string; startTime: Date; showTitle: string }>>();

    for (const slot of recurringSlots) {
        // Convert UTC to station time for pattern matching
        const stationTime = utcToStationTime(slot.startTime);
        const dayOfWeek = stationTime.getDay(); // 0-6 (Sunday-Saturday)
        const hourOfDay = stationTime.getHours(); // 0-23
        const minuteOfHour = stationTime.getMinutes(); // 0-59

        // Create a unique key for this time pattern
        const key = `${slot.showId}-${dayOfWeek}-${hourOfDay}-${minuteOfHour}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key)!.push({
            id: slot.id,
            startTime: slot.startTime,
            showTitle: slot.show.title
        });
    }

    console.log(`Identified ${groups.size} distinct recurring groups\n`);

    // Assign recurringGroupId to each group
    let totalUpdated = 0;
    let groupNumber = 0;

    for (const [key, slots] of groups.entries()) {
        groupNumber++;
        const recurringGroupId = crypto.randomUUID();

        // Extract pattern info for logging
        const [showId, dayOfWeek, hour, minute] = key.split('-');
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[parseInt(dayOfWeek)];
        const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

        console.log(`Group ${groupNumber}/${groups.size}:`);
        console.log(`  Show: ${slots[0].showTitle}`);
        console.log(`  Pattern: ${dayName} at ${timeStr} (station time)`);
        console.log(`  Instances: ${slots.length}`);
        console.log(`  Assigning recurringGroupId: ${recurringGroupId}`);

        // Update all slots in this group
        const slotIds = slots.map(s => s.id);
        const result = await prisma.scheduleSlot.updateMany({
            where: { id: { in: slotIds } },
            data: { recurringGroupId }
        });

        console.log(`  ✓ Updated ${result.count} slots\n`);
        totalUpdated += result.count;
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log(`Backfill complete!`);
    console.log(`  Total recurring groups: ${groups.size}`);
    console.log(`  Total slots updated: ${totalUpdated}`);
    console.log('═══════════════════════════════════════════════════════');
}

// Run the migration
backfillRecurringGroupIds()
    .then(() => {
        console.log('\n✓ Migration successful');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Migration failed:', error);
        process.exit(1);
    });

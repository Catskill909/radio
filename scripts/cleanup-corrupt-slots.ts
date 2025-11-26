import { prisma } from "@/lib/prisma";

/**
 * Cleanup script to remove corrupt zero-duration schedule slots
 * Run with: npx tsx scripts/cleanup-corrupt-slots.ts
 */
async function cleanupCorruptSlots() {
    console.log('🔍 Searching for corrupt slots...');

    // Find all slots (we'll filter in memory since SQLite datetime comparison is tricky)
    const allSlots = await prisma.scheduleSlot.findMany({
        include: { show: true }
    });

    // Filter for zero-duration slots
    const zeroDuration = allSlots.filter((slot: any) =>
        slot.startTime.getTime() === slot.endTime.getTime()
    );

    console.log(`Found ${zeroDuration.length} corrupt zero-duration slots`);

    if (zeroDuration.length > 0) {
        console.log('\nCorrupt slots:');
        zeroDuration.forEach((slot: any) => {
            console.log(`  - ${slot.show.title} (${slot.startTime.toLocaleString()})`);
        });

        const ids = zeroDuration.map((s: any) => s.id);
        await prisma.scheduleSlot.deleteMany({
            where: { id: { in: ids } }
        });
        console.log(`\n✅ Deleted ${ids.length} corrupt slots`);
    } else {
        console.log('✅ No corrupt slots found');
    }

    // Also find and report slots from the past (more than 60 days old)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const oldSlots = await prisma.scheduleSlot.findMany({
        where: {
            AND: [
                { startTime: { lt: sixtyDaysAgo } },
                { endTime: { lt: sixtyDaysAgo } }
            ]
        },
        include: { show: true }
    });

    if (oldSlots.length > 0) {
        console.log(`\n⚠️  Found ${oldSlots.length} slots older than 60 days`);
        console.log('Consider removing these manually if they are not needed.');
    }
}

cleanupCorruptSlots()
    .then(() => {
        console.log('\n✨ Cleanup complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

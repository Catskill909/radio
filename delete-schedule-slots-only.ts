/**
 * Delete ONLY schedule slots from the database
 * Keeps shows, recordings, and episodes intact
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteScheduleSlotsOnly() {
    console.log('🗑️  Clearing schedule slots...\n');

    try {
        // Get count before deletion
        const slotCount = await prisma.scheduleSlot.count();
        const showCount = await prisma.show.count();

        console.log('📊 Current database state:');
        console.log(`   Shows (will keep): ${showCount}`);
        console.log(`   Schedule Slots (will delete): ${slotCount}\n`);

        if (slotCount === 0) {
            console.log('✅ No schedule slots to delete.\n');
            return;
        }

        // Delete ONLY schedule slots (keeps shows, recordings, episodes)
        const deletedSlots = await prisma.scheduleSlot.deleteMany({});
        console.log(`✅ Deleted ${deletedSlots.count} schedule slots\n`);

        // Verify shows still exist
        const remainingShows = await prisma.show.count();
        console.log(`✓ Shows preserved: ${remainingShows}`);

        const recordings = await prisma.recording.count();
        console.log(`✓ Recordings preserved: ${recordings}`);

        const episodes = await prisma.episode.count();
        console.log(`✓ Episodes preserved: ${episodes}\n`);

        console.log('✅ Schedule cleared! Shows, recordings, and episodes are safe.\n');
        console.log('You can now reschedule shows with DST-aware logic.\n');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deleteScheduleSlotsOnly();

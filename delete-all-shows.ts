/**
 * Delete all shows and schedule slots from the database
 * Use this to clean up test data before implementing DST fixes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllShows() {
    console.log('🗑️  Starting cleanup...\n');

    try {
        // Get count before deletion
        const showCount = await prisma.show.count();
        const slotCount = await prisma.scheduleSlot.count();
        const recordingCount = await prisma.recording.count();
        const episodeCount = await prisma.episode.count();

        console.log('📊 Current database state:');
        console.log(`   Shows: ${showCount}`);
        console.log(`   Schedule Slots: ${slotCount}`);
        console.log(`   Recordings: ${recordingCount}`);
        console.log(`   Episodes: ${episodeCount}\n`);

        if (showCount === 0) {
            console.log('✅ Database is already clean. Nothing to delete.\n');
            return;
        }

        // Delete in order due to foreign key constraints
        console.log('Deleting data...');

        // Episodes reference recordings
        const deletedEpisodes = await prisma.episode.deleteMany({});
        console.log(`   ✓ Deleted ${deletedEpisodes.count} episodes`);

        // Recordings reference schedule slots
        const deletedRecordings = await prisma.recording.deleteMany({});
        console.log(`   ✓ Deleted ${deletedRecordings.count} recordings`);

        // Schedule slots reference shows (cascade delete is enabled, but being explicit)
        const deletedSlots = await prisma.scheduleSlot.deleteMany({});
        console.log(`   ✓ Deleted ${deletedSlots.count} schedule slots`);

        // Finally, delete shows
        const deletedShows = await prisma.show.deleteMany({});
        console.log(`   ✓ Deleted ${deletedShows.count} shows\n`);

        console.log('✅ Database cleaned successfully!\n');
        console.log('You can now start fresh with DST-aware scheduling.\n');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllShows();

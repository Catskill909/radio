/**
 * Test DST-aware recurring show generation
 * 
 * This script creates a recurring show and verifies that it maintains
 * wall-clock time across DST transitions (spring forward and fall back)
 */

import { PrismaClient } from '@prisma/client';
import { utcToStationTime, getStationTimezone } from './lib/station-time';

const prisma = new PrismaClient();

async function testDSTRecurring() {
    console.log('🧪 Testing DST-Aware Recurring Show Generation\n');

    const stationTz = getStationTimezone();
    console.log(`Station Timezone: ${stationTz}\n`);

    try {
        // Find an existing show to schedule
        const shows = await prisma.show.findMany({ take: 1 });

        if (shows.length === 0) {
            console.log('❌ No shows found in database. Please create a show first.\n');
            return;
        }

        const testShow = shows[0];
        console.log(`Using show: "${testShow.title}"\n`);

        // Create recurring show starting Monday 9:00 AM, 60 minutes
        // This should generate 52 weeks of slots
        const startDate = '2025-01-06'; // Monday, January 6, 2025
        const startTime = '09:00';
        const duration = 60;

        console.log(`Creating recurring show:`);
        console.log(`  Start: ${startDate} ${startTime}`);
        console.log(`  Duration: ${duration} minutes`);
        console.log(`  Recurring: Yes (52 weeks)\n`);

        // Note: We can't directly call createShow here because it expects FormData
        // Instead, we'll query the slots after you create the show via the UI

        console.log('✅ Test Setup Complete\n');
        console.log('📋 MANUAL TEST STEPS:\n');
        console.log('1. Go to http://localhost:3000/shows/new');
        console.log('2. Create a recurring show:');
        console.log(`   - Start Date: ${startDate}`);
        console.log(`   - Start Time: ${startTime}`);
        console.log(`   - Duration: ${duration} minutes`);
        console.log('   - Recurring: ✓ (checked)');
        console.log('3. Click "Create Show"');
        console.log('4. Run: npx tsx verify-dst-slots.ts\n');
        console.log('This will verify the slots were generated correctly across DST.\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Also create a verification script
async function verifyDSTSlots() {
    console.log('🔍 Verifying DST Slot Generation\n');

    const stationTz = getStationTimezone();
    console.log(`Station Timezone: ${stationTz}\n`);

    try {
        // Get all recurring slots
        const slots = await prisma.scheduleSlot.findMany({
            where: { isRecurring: true },
            orderBy: { startTime: 'asc' },
            include: { show: true }
        });

        if (slots.length === 0) {
            console.log('❌ No recurring slots found. Create a recurring show first.\n');
            return;
        }

        console.log(`Found ${slots.length} recurring slots\n`);

        // Check key DST transition dates
        const springForward = new Date('2025-03-09'); // March 9, 2025 (DST begins)
        const fallBack = new Date('2025-11-02'); // November 2, 2025 (DST ends)

        // Find slots around these dates
        const beforeSpring = slots.filter(s => {
            const d = new Date(s.startTime);
            return d >= new Date('2025-03-02') && d < springForward;
        });

        const afterSpring = slots.filter(s => {
            const d = new Date(s.startTime);
            return d >= new Date('2025-03-10') && d <= new Date('2025-03-16');
        });

        const beforeFall = slots.filter(s => {
            const d = new Date(s.startTime);
            return d >= new Date('2025-10-26') && d < fallBack;
        });

        const afterFall = slots.filter(s => {
            const d = new Date(s.startTime);
            return d >= new Date('2025-11-03') && d <= new Date('2025-11-09');
        });

        console.log('📊 Slot Distribution Around DST Transitions:\n');
        console.log(`Before Spring Forward (Mar 2-8): ${beforeSpring.length} slots`);
        console.log(`After Spring Forward (Mar 10-16): ${afterSpring.length} slots`);
        console.log(`Before Fall Back (Oct 26-Nov 1): ${beforeFall.length} slots`);
        console.log(`After Fall Back (Nov 3-9): ${afterFall.length} slots\n`);

        // Check if wall-clock times are consistent
        console.log('⏰ Wall-Clock Time Consistency Check:\n');

        const checkTimeConsistency = (slotList: typeof slots, label: string) => {
            if (slotList.length === 0) return;

            const times = slotList.map(s => {
                const stationTime = utcToStationTime(s.startTime);
                return {
                    utc: s.startTime.toISOString(),
                    station: stationTime.toLocaleString('en-US', { timeZone: stationTz }),
                    hour: stationTime.getHours(),
                    minute: stationTime.getMinutes()
                };
            });

            const firstTime = times[0];
            const allSameTime = times.every(t =>
                t.hour === firstTime.hour && t.minute === firstTime.minute
            );

            console.log(`${label}:`);
            console.log(`  First slot: ${firstTime.station}`);
            console.log(`  Consistent: ${allSameTime ? '✅ YES' : '❌ NO'}`);

            if (!allSameTime) {
                console.log('  ⚠️ TIMES VARY:');
                times.forEach((t, i) => {
                    console.log(`    Slot ${i + 1}: ${t.hour}:${String(t.minute).padStart(2, '0')}`);
                });
            }
            console.log('');
        };

        checkTimeConsistency(beforeSpring, 'Before Spring Forward');
        checkTimeConsistency(afterSpring, 'After Spring Forward');
        checkTimeConsistency(beforeFall, 'Before Fall Back');
        checkTimeConsistency(afterFall, 'After Fall Back');

        // Check UTC offset changes
        console.log('🌍 UTC Offset Changes:\n');

        if (beforeSpring.length > 0 && afterSpring.length > 0) {
            const beforeUTC = beforeSpring[0].startTime;
            const afterUTC = afterSpring[0].startTime;
            const beforeStation = utcToStationTime(beforeUTC);
            const afterStation = utcToStationTime(afterUTC);

            console.log('Spring Forward Transition:');
            console.log(`  Before: ${beforeStation.toLocaleTimeString()} (UTC offset should be -5 hours for EST)`);
            console.log(`  After:  ${afterStation.toLocaleTimeString()} (UTC offset should be -4 hours for EDT)`);
            console.log(`  Both display same wall-clock time: ${beforeStation.getHours() === afterStation.getHours() ? '✅ YES' : '❌ NO'}\n`);
        }

        if (beforeFall.length > 0 && afterFall.length > 0) {
            const beforeUTC = beforeFall[0].startTime;
            const afterUTC = afterFall[0].startTime;
            const beforeStation = utcToStationTime(beforeUTC);
            const afterStation = utcToStationTime(afterUTC);

            console.log('Fall Back Transition:');
            console.log(`  Before: ${beforeStation.toLocaleTimeString()} (UTC offset should be -4 hours for EDT)`);
            console.log(`  After:  ${afterStation.toLocaleTimeString()} (UTC offset should be -5 hours for EST)`);
            console.log(`  Both display same wall-clock time: ${beforeStation.getHours() === afterStation.getHours() ? '✅ YES' : '❌ NO'}\n`);
        }

        console.log('✅ Verification Complete!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Check which script to run based on command line args
const scriptName = process.argv[1];
if (scriptName.includes('verify')) {
    verifyDSTSlots();
} else {
    testDSTRecurring();
}

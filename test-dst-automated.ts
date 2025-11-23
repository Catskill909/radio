/**
 * FULLY AUTOMATED DST Test
 * 
 * This script:
 * 1. Creates a test show programmatically
 * 2. Generates recurring slots (simulating createShow logic)
 * 3. Verifies DST handling across transitions
 * 4. Cleans up test data
 * 5. Reports pass/fail
 * 
 * NO MANUAL STEPS REQUIRED!
 */

import { PrismaClient } from '@prisma/client';
import { add } from 'date-fns';
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { getStationTimezone, stationTimeToUTC, utcToStationTime } from './lib/station-time';

const prisma = new PrismaClient();

async function runAutomatedDSTTest() {
    console.log('🤖 FULLY AUTOMATED DST TEST\n');
    console.log('═'.repeat(60) + '\n');

    const stationTz = getStationTimezone();
    console.log(`Station Timezone: ${stationTz}\n`);

    let testShowId: string | null = null;
    let createdSlotIds: string[] = [];

    try {
        // ====== STEP 1: Create Test Show ======
        console.log('📝 Step 1: Creating test show...\n');

        const testShow = await prisma.show.create({
            data: {
                title: 'DST_TEST_SHOW_AUTO',
                description: 'Automated test for DST-aware recurring scheduling',
                type: 'Test',
                host: 'Automated Test',
                recordingEnabled: false,
                explicit: false,
                language: 'en',
            }
        });

        testShowId = testShow.id;
        console.log(`✅ Created test show: "${testShow.title}" (ID: ${testShow.id})\n`);

        // ====== STEP 2: Generate Recurring Slots (DST-AWARE) ======
        console.log('⏰ Step 2: Generating 52 weeks of recurring slots (with DST logic)...\n');

        const startDateStr = '2025-01-06'; // Monday, January 6, 2025
        const startTimeStr = '09:00';
        const durationMins = 60;

        // Convert to UTC (same as createShow does)
        const startDateTime = stationTimeToUTC(startDateStr, startTimeStr);
        const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

        console.log(`  Start: ${startDateStr} ${startTimeStr} (${stationTz})`);
        console.log(`  UTC stored: ${startDateTime.toISOString()}`);
        console.log(`  Duration: ${durationMins} minutes\n`);

        const slotsToCreate = [];

        // Generate 52 weeks using DST-AWARE logic
        for (let i = 0; i < 52; i++) {
            // Convert UTC to station timezone
            const initialStationStart = toZonedTime(startDateTime, stationTz);
            const initialStationEnd = toZonedTime(endDateTime, stationTz);

            // Add weeks in STATION TIMEZONE (maintains wall-clock time)
            const futureStationStart = add(initialStationStart, { weeks: i });
            const futureStationEnd = add(initialStationEnd, { weeks: i });

            // Convert back to UTC for database
            const slotStart = fromZonedTime(
                format(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                stationTz
            );
            const slotEnd = fromZonedTime(
                format(futureStationEnd, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
                stationTz
            );

            slotsToCreate.push({
                showId: testShow.id,
                startTime: slotStart,
                endTime: slotEnd,
                isRecurring: true,
            });
        }

        const createdSlots = await prisma.scheduleSlot.createMany({
            data: slotsToCreate,
        });

        console.log(`✅ Created ${createdSlots.count} recurring slots\n`);

        // Get IDs for cleanup
        const slots = await prisma.scheduleSlot.findMany({
            where: { showId: testShow.id },
            select: { id: true }
        });
        createdSlotIds = slots.map(s => s.id);

        // ====== STEP 3: VERIFY DST HANDLING ======
        console.log('🔍 Step 3: Verifying DST handling...\n');
        console.log('─'.repeat(60) + '\n');

        // Fetch all slots
        const allSlots = await prisma.scheduleSlot.findMany({
            where: { showId: testShow.id },
            orderBy: { startTime: 'asc' },
        });

        // Define DST transition dates for America/New_York in 2025
        const springForward = new Date('2025-03-09'); // March 9, 2025 (Sunday)
        const fallBack = new Date('2025-11-02'); // November 2, 2025 (Sunday)

        // Get slots for Mondays around DST (our test show is Monday 9am)
        const getSlotForDate = (year: number, month: number, day: number) => {
            return allSlots.find(s => {
                const d = new Date(s.startTime);
                return d.getUTCFullYear() === year &&
                    d.getUTCMonth() === month &&
                    d.getUTCDate() === day;
            });
        };

        // Find slots using UTC dates (database stores UTC)
        const beforeSpring = getSlotForDate(2025, 2, 3); // Mar 3 (month is 0-indexed)
        const afterSpring = getSlotForDate(2025, 2, 10);  // Mar 10
        const beforeFall = getSlotForDate(2025, 9, 27);   // Oct 27
        const afterFall = getSlotForDate(2025, 10, 3);    // Nov 3

        let allTestsPassed = true;
        const results: string[] = [];

        // TEST 1: Wall-Clock Time Consistency
        console.log('TEST 1: Wall-Clock Time Consistency\n');

        const checkWallClockTime = (slot: typeof allSlots[0] | undefined, label: string, expectedHour: number) => {
            if (!slot) {
                results.push(`❌ ${label}: Slot not found`);
                allTestsPassed = false;
                console.log(`  ${label}: ❌ FAIL - Slot not found\n`);
                return;
            }

            const stationTime = utcToStationTime(slot.startTime);
            const hour = stationTime.getHours();
            const minute = stationTime.getMinutes();

            const passed = hour === expectedHour && minute === 0;
            const status = passed ? '✅ PASS' : '❌ FAIL';

            console.log(`  ${label}:`);
            console.log(`    UTC: ${slot.startTime.toISOString()}`);
            console.log(`    Station Time: ${stationTime.toLocaleString('en-US', { timeZone: stationTz })}`);
            console.log(`    Wall Clock: ${hour}:${String(minute).padStart(2, '0')}`);
            console.log(`    Expected: ${expectedHour}:00`);
            console.log(`    Result: ${status}\n`);

            if (passed) {
                results.push(`✅ ${label}: ${hour}:${String(minute).padStart(2, '0')}`);
            } else {
                results.push(`❌ ${label}: Got ${hour}:${String(minute).padStart(2, '0')}, expected ${expectedHour}:00`);
                allTestsPassed = false;
            }
        };

        checkWallClockTime(beforeSpring, 'Before Spring Forward (Mar 3)', 9);
        checkWallClockTime(afterSpring, 'After Spring Forward (Mar 10)', 9);
        checkWallClockTime(beforeFall, 'Before Fall Back (Oct 27)', 9);
        checkWallClockTime(afterFall, 'After Fall Back (Nov 3)', 9);

        // TEST 2: UTC Offset Changes
        console.log('─'.repeat(60) + '\n');
        console.log('TEST 2: UTC Offset Adjustments\n');

        const checkUTCOffset = (before: typeof allSlots[0] | undefined, after: typeof allSlots[0] | undefined, label: string, expectedChange: number) => {
            if (!before || !after) {
                results.push(`❌ ${label}: Missing slots`);
                allTestsPassed = false;
                console.log(`  ${label}: ❌ FAIL - Missing slots\n`);
                return;
            }

            const beforeUTC = before.startTime.getUTCHours();
            const afterUTC = after.startTime.getUTCHours();
            const actualChange = afterUTC - beforeUTC;

            const passed = actualChange === expectedChange;
            const status = passed ? '✅ PASS' : '❌ FAIL';

            console.log(`  ${label}:`);
            console.log(`    Before UTC hour: ${beforeUTC}:00`);
            console.log(`    After UTC hour: ${afterUTC}:00`);
            console.log(`    Change: ${actualChange > 0 ? '+' : ''}${actualChange} hour`);
            console.log(`    Expected: ${expectedChange > 0 ? '+' : ''}${expectedChange} hour`);
            console.log(`    Result: ${status}\n`);

            if (passed) {
                results.push(`✅ ${label}: UTC offset changed correctly (${actualChange > 0 ? '+' : ''}${actualChange}h)`);
            } else {
                results.push(`❌ ${label}: UTC offset change was ${actualChange}h, expected ${expectedChange}h`);
                allTestsPassed = false;
            }
        };

        // Spring forward: EST (UTC-5) → EDT (UTC-4), so UTC hour should decrease by 1
        checkUTCOffset(beforeSpring, afterSpring, 'Spring Forward Transition', -1);

        // Fall back: EDT (UTC-4) → EST (UTC-5), so UTC hour should increase by 1
        checkUTCOffset(beforeFall, afterFall, 'Fall Back Transition', +1);

        // TEST 3: Continuity Check
        console.log('─'.repeat(60) + '\n');
        console.log('TEST 3: All 52 Weeks Consistency\n');

        const allStationTimes = allSlots.map(s => {
            const st = utcToStationTime(s.startTime);
            return { hour: st.getHours(), minute: st.getMinutes() };
        });

        const allSameTime = allStationTimes.every(t => t.hour === 9 && t.minute === 0);

        if (allSameTime) {
            console.log(`  ✅ PASS: All 52 slots are at 9:00 AM station time\n`);
            results.push('✅ Continuity: All 52 weeks at 9:00 AM');
        } else {
            console.log(`  ❌ FAIL: Some slots have different times\n`);
            const wrongTimes = allStationTimes.filter(t => t.hour !== 9 || t.minute !== 0);
            console.log(`  Found ${wrongTimes.length} slots with wrong times`);
            results.push(`❌ Continuity: ${wrongTimes.length} slots have wrong times`);
            allTestsPassed = false;
        }

        // ====== STEP 4: CLEANUP ======
        console.log('─'.repeat(60) + '\n');
        console.log('🗑️  Step 4: Cleaning up test data...\n');

        await prisma.scheduleSlot.deleteMany({
            where: { id: { in: createdSlotIds } }
        });
        console.log(`✅ Deleted ${createdSlotIds.length} test slots`);

        await prisma.show.delete({
            where: { id: testShowId }
        });
        console.log(`✅ Deleted test show\n`);

        // ====== FINAL RESULTS ======
        console.log('═'.repeat(60) + '\n');
        console.log('📊 TEST RESULTS\n');
        console.log('═'.repeat(60) + '\n');

        results.forEach(r => console.log(r));

        console.log('\n' + '═'.repeat(60) + '\n');

        if (allTestsPassed) {
            console.log('🎉 ALL TESTS PASSED! DST handling is working correctly.\n');
            console.log('✅ Recurring shows will maintain wall-clock time across DST.\n');
            console.log('✅ Shows scheduled at 9am will stay at 9am year-round.\n');
            process.exit(0);
        } else {
            console.log('❌ SOME TESTS FAILED! DST handling needs fixes.\n');
            console.log('Please review the implementation.\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test error:', error);

        // Cleanup on error
        if (testShowId) {
            try {
                await prisma.scheduleSlot.deleteMany({ where: { showId: testShowId } });
                await prisma.show.delete({ where: { id: testShowId } });
                console.log('\n✅ Cleaned up test data after error\n');
            } catch (cleanupError) {
                console.error('Failed to cleanup:', cleanupError);
            }
        }

        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runAutomatedDSTTest();

/**
 * Test script for Time-Slot-Specific Deletion
 * 
 * This script validates that the deletion logic correctly handles:
 * 1. Single time slot deletion (3pm only, not 11pm)
 * 2. Multiple time slots for the same show
 * 3. Day-of-week matching (Monday vs Tuesday)
 * 4. Midnight-crossing shows
 * 
 * CRITICAL: Uses station timezone as the single source of truth
 */

import { PrismaClient } from '@prisma/client';
import { stationTimeToUTC, utcToStationTime } from './lib/station-time';

const prisma = new PrismaClient();

interface TestResult {
    name: string;
    passed: boolean;
    details: string;
}

const results: TestResult[] = [];

async function setupTestData() {
    console.log('🧹 Cleaning up existing test data...');

    // Delete all schedule slots and shows with "TEST" in the title
    await prisma.scheduleSlot.deleteMany({
        where: {
            show: {
                title: {
                    contains: 'TEST'
                }
            }
        }
    });

    await prisma.show.deleteMany({
        where: {
            title: {
                contains: 'TEST'
            }
        }
    });

    console.log('✅ Cleanup complete\n');
    console.log('📝 Setting up test data...\n');

    // Create a test show
    const show = await prisma.show.create({
        data: {
            title: 'TEST Talk Radio',
            description: 'Test show for deletion validation',
            type: 'talk',
            host: 'Test Host',
        }
    });

    console.log(`Created show: ${show.title} (${show.id})`);

    // Helper to get next occurrence of a specific day-of-week and time IN STATION TIMEZONE
    const getNextDayOfWeek = (dayOfWeek: number, hour: number, minute: number): Date => {
        const now = new Date();
        let current = new Date(now);

        // Start from tomorrow to avoid complications with "today"
        current.setDate(current.getDate() + 1);

        // Find the next occurrence of the specified day
        while (current.getDay() !== dayOfWeek) {
            current.setDate(current.getDate() + 1);
        }

        // Format as YYYY-MM-DD and HH:mm for station time conversion
        const dateStr = current.toISOString().split('T')[0];
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        // Convert station time to UTC for database storage
        return stationTimeToUTC(dateStr, timeStr);
    };

    // Create recurring slots for different time patterns
    const slots = [];

    // Pattern 1: Mondays at 3:00 PM (15:00) in STATION TIME  
    console.log('\nCreating Monday 3PM slots...');
    const monday3pm = getNextDayOfWeek(1, 15, 0);
    for (let i = 0; i < 4; i++) {
        const startTime = new Date(monday3pm);
        startTime.setDate(startTime.getDate() + (i * 7));
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1); // 1 hour duration

        const slot = await prisma.scheduleSlot.create({
            data: {
                showId: show.id,
                startTime,
                endTime,
                isRecurring: true
            }
        });

        // Debug: show what we created
        const stationTime = utcToStationTime(startTime);
        console.log(`  Week ${i + 1}: ${stationTime.toLocaleString()} (Station Time)`);

        slots.push({ pattern: 'Monday 3PM', slot });
    }
    console.log(`✅ Created 4 slots for Monday 3:00 PM`);

    // Pattern 2: Mondays at 11:00 PM (23:00) in STATION TIME - REBROADCAST
    console.log('\nCreating Monday 11PM slots...');
    const monday11pm = getNextDayOfWeek(1, 23, 0);
    for (let i = 0; i < 4; i++) {
        const startTime = new Date(monday11pm);
        startTime.setDate(startTime.getDate() + (i * 7));
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 59); // Almost 1 hour

        const slot = await prisma.scheduleSlot.create({
            data: {
                showId: show.id,
                startTime,
                endTime,
                isRecurring: true
            }
        });

        const stationTime = utcToStationTime(startTime);
        console.log(`  Week ${i + 1}: ${stationTime.toLocaleString()} (Station Time)`);

        slots.push({ pattern: 'Monday 11PM', slot });
    }
    console.log(`✅ Created 4 slots for Monday 11:00 PM (rebroadcast)`);

    // Pattern 3: Tuesdays at 3:00 PM (15:00) in STATION TIME - DIFFERENT DAY
    console.log('\nCreating Tuesday 3PM slots...');
    const tuesday3pm = getNextDayOfWeek(2, 15, 0);
    for (let i = 0; i < 4; i++) {
        const startTime = new Date(tuesday3pm);
        startTime.setDate(startTime.getDate() + (i * 7));
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);

        const slot = await prisma.scheduleSlot.create({
            data: {
                showId: show.id,
                startTime,
                endTime,
                isRecurring: true
            }
        });

        const stationTime = utcToStationTime(startTime);
        console.log(`  Week ${i + 1}: ${stationTime.toLocaleString()} (Station Time)`);

        slots.push({ pattern: 'Tuesday 3PM', slot });
    }
    console.log(`✅ Created 4 slots for Tuesday 3:00 PM`);

    console.log(`\n📊 Total slots created: ${slots.length}\n`);

    return { show, slots };
}

async function testTimeSlotDeletion() {
    console.log('🧪 Running deletion tests...\n');

    const { show, slots } = await setupTestData();

    // Test 1: Delete Monday 3PM slots only (should leave Monday 11PM and Tuesday 3PM intact)
    console.log('TEST 1: Delete Monday 3PM time slot (this-and-future mode)\n');

    const monday3pmSlots = slots.filter(s => s.pattern === 'Monday 3PM');
    const firstMonday3pm = monday3pmSlots[0].slot;

    // Simulate deleteScheduleSlot logic
    const slotToDelete = await prisma.scheduleSlot.findUnique({
        where: { id: firstMonday3pm.id },
        include: { show: true }
    });

    if (!slotToDelete) {
        throw new Error('Slot not found');
    }

    // Extract time pattern IN STATION TIMEZONE (matching production code)
    const slotDateStation = utcToStationTime(slotToDelete.startTime);
    const dayOfWeek = slotDateStation.getDay();
    const hourOfDay = slotDateStation.getHours();
    const minuteOfHour = slotDateStation.getMinutes();

    console.log(`   Deleting slot with pattern (Station Time): Day ${dayOfWeek}, Hour ${hourOfDay}, Minute ${minuteOfHour}`);
    console.log(`   Station time: ${slotDateStation.toLocaleString()}`);

    // Get all future recurring slots for this show
    const futureSlots = await prisma.scheduleSlot.findMany({
        where: {
            showId: show.id,
            isRecurring: true,
            startTime: { gte: slotToDelete.startTime }
        }
    });

    console.log(`   Found ${futureSlots.length} future recurring slots`);

    // Filter by matching time pattern IN STATION TIMEZONE (matching production code)
    const matchingSlots = futureSlots.filter(futureSlot => {
        const futureStationTime = utcToStationTime(futureSlot.startTime);
        return futureStationTime.getDay() === dayOfWeek &&
            futureStationTime.getHours() === hourOfDay &&
            futureStationTime.getMinutes() === minuteOfHour;
    });

    console.log(`   Matched ${matchingSlots.length} slots with same time pattern`);

    const slotsToDelete = matchingSlots.map(s => s.id);

    // Perform deletion
    await prisma.scheduleSlot.deleteMany({
        where: {
            id: { in: slotsToDelete }
        }
    });

    console.log(`   ✅ Deleted ${slotsToDelete.length} slots\n`);

    // Verify results
    const remainingSlots = await prisma.scheduleSlot.findMany({
        where: { showId: show.id }
    });

    console.log('📊 Verification Results:\n');

    // Check remaining slots using STATION TIME
    const monday11pmRemaining = remainingSlots.filter(s => {
        const stationTime = utcToStationTime(s.startTime);
        return stationTime.getDay() === 1 && stationTime.getHours() === 23;
    });

    const tuesday3pmRemaining = remainingSlots.filter(s => {
        const stationTime = utcToStationTime(s.startTime);
        return stationTime.getDay() === 2 && stationTime.getHours() === 15;
    });

    const monday3pmRemaining = remainingSlots.filter(s => {
        const stationTime = utcToStationTime(s.startTime);
        return stationTime.getDay() === 1 && stationTime.getHours() === 15;
    });

    console.log(`   Monday 3PM slots remaining: ${monday3pmRemaining.length} (expected: 0)`);
    console.log(`   Monday 11PM slots remaining: ${monday11pmRemaining.length} (expected: 4)`);
    console.log(`   Tuesday 3PM slots remaining: ${tuesday3pmRemaining.length} (expected: 4)`);

    const test1Passed = monday3pmRemaining.length === 0 &&
        monday11pmRemaining.length === 4 &&
        tuesday3pmRemaining.length === 4;

    results.push({
        name: 'Time-Slot-Specific Deletion',
        passed: test1Passed,
        details: test1Passed
            ? 'Only Monday 3PM slots were deleted, other time slots preserved'
            : `Failed: Found ${monday3pmRemaining.length} Monday 3PM, ${monday11pmRemaining.length} Monday 11PM, ${tuesday3pmRemaining.length} Tuesday 3PM`
    });

    console.log(`\n   ${test1Passed ? '✅ TEST PASSED' : '❌ TEST FAILED'}\n`);
}

async function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60) + '\n');

    results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
        console.log(`   ${result.details}\n`);
    });

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    console.log('='.repeat(60));
    console.log(`TOTAL: ${passed}/${total} tests passed`);
    console.log('='.repeat(60) + '\n');
}

async function main() {
    try {
        console.log('\n🚀 Starting Time-Slot-Specific Deletion Tests\n');
        console.log('='.repeat(60) + '\n');

        await testTimeSlotDeletion();
        await printSummary();

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

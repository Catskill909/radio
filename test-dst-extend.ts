/**
 * Standalone test for the DST-safe slot generation used by
 * extend-recurring-shows.ts (fixed 2026-06-27) and the in-service auto-extend
 * (recorder-service.ts). No database — pure date math.
 *
 *   npx tsx test-dst-extend.ts
 *
 * Proves two things across the Nov 1 2026 fall-back boundary:
 *   1. The DST-AWARE pattern keeps each weekly slot at the same station
 *      wall-clock time (e.g. 19:00) and shifts the UTC offset (EDT→EST).
 *   2. The OLD naive `setDate(+7)` pattern drifts the wall-clock time by 1h
 *      after the transition — documenting exactly the bug that was fixed.
 */

import { add } from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

const TZ = 'America/New_York';
let failures = 0;
function check(name: string, cond: boolean, detail = '') {
    if (cond) console.log(`  ✅ ${name}`);
    else { failures++; console.log(`  ❌ ${name}${detail ? `  — ${detail}` : ''}`); }
}

const wall = (d: Date) => formatTz(d, 'yyyy-MM-dd HH:mm:ss', { timeZone: TZ });
const wallTime = (d: Date) => formatTz(d, 'HH:mm:ss', { timeZone: TZ });

// Latest existing slot: a 7:00 PM show on Sun Oct 25 2026 (still EDT).
const latestStart = fromZonedTime('2026-10-25T19:00:00', TZ); // => 2026-10-25T23:00:00Z

console.log('\nDST-safe extend logic — extend-recurring-shows.ts\n');
console.log(`  base slot: ${wall(latestStart)} ${TZ}  (${latestStart.toISOString()})\n`);

// --- 1. DST-AWARE pattern (the fix) ------------------------------------------
{
    let allWallClockStable = true;
    let crossedBoundary = false;
    for (let i = 1; i <= 6; i++) {
        const latestStationStart = toZonedTime(latestStart, TZ);
        const futureStationStart = add(latestStationStart, { weeks: i });
        const newStart = fromZonedTime(
            formatTz(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: TZ }),
            TZ
        );
        const t = wallTime(newStart);
        if (t !== '19:00:00') allWallClockStable = false;
        // The Nov 1+ slots are EST: 7 PM EST = 00:00 UTC next day (vs 23:00 UTC for EDT).
        if (newStart.getUTCHours() === 0) crossedBoundary = true;
        console.log(`    +${i}w → ${wall(newStart)}  (${newStart.toISOString()})`);
    }
    console.log('');
    check('DST-aware: every weekly slot stays at 19:00 station time', allWallClockStable);
    check('DST-aware: UTC offset actually changes across Nov 1 (EDT→EST)', crossedBoundary);
}

// --- 2. NAIVE pattern (the old bug) ------------------------------------------
{
    // i=1 lands on Nov 1 2026 — the first post-transition week.
    const naive = new Date(latestStart);
    naive.setUTCDate(naive.getUTCDate() + 7); // mimics setDate(+7) on a UTC server
    const drifted = wallTime(naive);
    console.log(`\n  naive +1w → ${wall(naive)}  (${naive.toISOString()})`);
    check('naive: drifts to 18:00 station time after DST (bug reproduced)', drifted === '18:00:00', `got ${drifted}`);
    check('naive: NOT equal to the DST-aware result (fix is meaningful)', drifted !== '19:00:00');
}

console.log('');
if (failures === 0) { console.log('✅ ALL PASSED\n'); process.exit(0); }
else { console.log(`❌ ${failures} FAILURE(S)\n`); process.exit(1); }

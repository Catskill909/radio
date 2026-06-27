/**
 * Standalone test for lib/recurring-series.ts (recurringSeriesKey).
 *
 *   npx tsx test-recurring-series.ts
 *
 * Guards against the "daily show collapses to one weekday" bug: extension must
 * group recurring slots by SERIES, not by show. A daily show is modelled as one
 * weekly series per weekday (distinct recurringGroupId), so grouping by series
 * must yield one group per day; grouping by show yields just one.
 */

import { recurringSeriesKey, planMissingSeriesSlots } from './lib/recurring-series';
import { fromZonedTime, format as formatTz } from 'date-fns-tz';

const TZ = 'America/New_York';
let failures = 0;
function check(name: string, cond: boolean, detail = '') {
    if (cond) console.log(`  ✅ ${name}`);
    else { failures++; console.log(`  ❌ ${name}${detail ? `  — ${detail}` : ''}`); }
}

const slot = (recurringGroupId: string | null, showId: string, iso: string) => ({
    recurringGroupId, showId, startTime: new Date(iso),
});

console.log('\nrecurringSeriesKey — lib/recurring-series.ts\n');

// 1. Same recurringGroupId → same key (regardless of week).
{
    const a = recurringSeriesKey(slot('grp-mon', 'bbc', '2026-11-02T05:00:00Z'), TZ);
    const b = recurringSeriesKey(slot('grp-mon', 'bbc', '2026-11-09T05:00:00Z'), TZ);
    check('same recurringGroupId across weeks → same key', a === b, `${a} vs ${b}`);
}

// 2. Distinct recurringGroupId → distinct keys.
{
    const mon = recurringSeriesKey(slot('grp-mon', 'bbc', '2026-11-02T05:00:00Z'), TZ);
    const tue = recurringSeriesKey(slot('grp-tue', 'bbc', '2026-11-03T05:00:00Z'), TZ);
    check('different recurringGroupId → different key', mon !== tue);
}

// 3. THE FIX: a daily show (7 weekday series, same showId) → 7 series groups, not 1.
{
    const days = ['grp-sun','grp-mon','grp-tue','grp-wed','grp-thu','grp-fri','grp-sat'];
    const daily = days.map((g, i) => slot(g, 'bbc', `2026-11-0${i + 1}T05:00:00Z`));
    const seriesGroups = new Set(daily.map(s => recurringSeriesKey(s, TZ)));
    const showGroups = new Set(daily.map(s => s.showId));
    check('daily show → 7 series groups (keeps every day)', seriesGroups.size === 7, `got ${seriesGroups.size}`);
    check('...whereas grouping by show would collapse to 1 (the old bug)', showGroups.size === 1);
}

// 4. Legacy null-group slots: same show + weekday + time → same key; different day → different.
{
    const monA = recurringSeriesKey(slot(null, 'legacy', '2026-11-02T05:00:00Z'), TZ); // Mon
    const monB = recurringSeriesKey(slot(null, 'legacy', '2026-11-09T05:00:00Z'), TZ); // Mon next wk
    const wed  = recurringSeriesKey(slot(null, 'legacy', '2026-11-04T05:00:00Z'), TZ); // Wed
    check('null-group: same weekday+time → same key', monA === monB, `${monA} vs ${monB}`);
    check('null-group: different weekday → different key', monA !== wed);
    check('null-group keys are distinct from grouped keys', monA.startsWith('leg:'));
}

// --- planMissingSeriesSlots (gap-fill + forward extend) ----------------------
console.log('\nplanMissingSeriesSlots — lib/recurring-series.ts\n');

// Build a slot from a station-local wall-clock string (e.g. "2026-11-16T00:00:00").
const wcSlot = (local: string, durMin = 60) => {
    const start = fromZonedTime(local, TZ);
    return { startTime: start, endTime: new Date(start.getTime() + durMin * 60000) };
};
const datesOf = (slots: { startTime: Date }[]) =>
    slots.map((s) => formatTz(s.startTime, 'yyyy-MM-dd', { timeZone: TZ })).sort();

// 5. Fills an internal gap (missing Nov 30 between existing Mondays).
{
    const slots = ['2026-11-16', '2026-11-23', '2026-12-07', '2026-12-14'].map((d) => wcSlot(`${d}T00:00:00`));
    const missing = planMissingSeriesSlots({ slots, stationTz: TZ, from: fromZonedTime('2026-11-16T00:00:00', TZ), until: fromZonedTime('2026-12-14T00:00:00', TZ) });
    check('fills the internal gap (only Nov 30)', JSON.stringify(datesOf(missing)) === JSON.stringify(['2026-11-30']), datesOf(missing).join(','));
}

// 6. Extends forward to `until`.
{
    const slots = ['2026-11-16', '2026-11-23', '2026-11-30'].map((d) => wcSlot(`${d}T00:00:00`));
    const missing = planMissingSeriesSlots({ slots, stationTz: TZ, from: fromZonedTime('2026-11-16T00:00:00', TZ), until: fromZonedTime('2026-12-21T00:00:00', TZ) });
    check('extends forward (Dec 7, 14, 21)', JSON.stringify(datesOf(missing)) === JSON.stringify(['2026-12-07', '2026-12-14', '2026-12-21']), datesOf(missing).join(','));
}

// 7. Idempotent: a complete series has nothing missing.
{
    const slots = ['2026-11-16', '2026-11-23', '2026-11-30', '2026-12-07'].map((d) => wcSlot(`${d}T00:00:00`));
    const missing = planMissingSeriesSlots({ slots, stationTz: TZ, from: fromZonedTime('2026-11-16T00:00:00', TZ), until: fromZonedTime('2026-12-07T00:00:00', TZ) });
    check('complete series → nothing missing', missing.length === 0, `got ${missing.length}`);
}

// 8. Never generates before `from` (future-dated series must not be backfilled).
{
    const slots = ['2026-11-16', '2026-11-23'].map((d) => wcSlot(`${d}T00:00:00`));
    const missing = planMissingSeriesSlots({ slots, stationTz: TZ, from: fromZonedTime('2026-11-20T00:00:00', TZ), until: fromZonedTime('2026-12-07T00:00:00', TZ) });
    const ds = datesOf(missing);
    check('respects `from` (no Nov 16; fills Nov 30 + Dec 7)', JSON.stringify(ds) === JSON.stringify(['2026-11-30', '2026-12-07']), ds.join(','));
}

// 9. DST-aware: generated 7 PM slots stay 7 PM across spring-forward (Mar 14 2027).
{
    const slots = [wcSlot('2027-03-07T19:00:00')]; // Sunday 7 PM, EST
    const missing = planMissingSeriesSlots({ slots, stationTz: TZ, from: fromZonedTime('2027-03-07T19:00:00', TZ), until: fromZonedTime('2027-03-21T19:00:00', TZ) });
    const allSeven = missing.every((s) => formatTz(s.startTime, 'HH:mm', { timeZone: TZ }) === '19:00');
    check('generated slots hold 19:00 station time across DST', missing.length === 2 && allSeven, `${missing.length} slots: ` + missing.map((s) => formatTz(s.startTime, 'MMM d HH:mm', { timeZone: TZ })).join(', '));
}

// 10. Empty series → [].
{
    const missing = planMissingSeriesSlots({ slots: [], stationTz: TZ, from: new Date('2026-11-01'), until: new Date('2026-12-01') });
    check('empty series → []', missing.length === 0);
}

console.log('');
if (failures === 0) { console.log('✅ ALL PASSED\n'); process.exit(0); }
else { console.log(`❌ ${failures} FAILURE(S)\n`); process.exit(1); }

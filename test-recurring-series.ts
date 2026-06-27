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

import { recurringSeriesKey } from './lib/recurring-series';

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

console.log('');
if (failures === 0) { console.log('✅ ALL PASSED\n'); process.exit(0); }
else { console.log(`❌ ${failures} FAILURE(S)\n`); process.exit(1); }

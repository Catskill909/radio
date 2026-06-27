/**
 * Standalone test for lib/dst.ts (DST transition detection).
 *
 *   npx tsx test-dst-transition.ts
 *
 * No test framework in this repo — follows the existing standalone-tsx
 * convention (see test-dst-automated.ts). Prints PASS/FAIL and exits non-zero
 * on any failure so it is CI-friendly.
 *
 * Ground truth for the assertions is derived independently of lib/dst.ts:
 *   - hardcoded instants confirmed via Intl (US rules: fall back = first Sun of
 *     Nov, spring forward = second Sun of Mar);
 *   - plus a cross-check that scans with an Intl-based offset function and
 *     compares the detected instant to the helper's, to the minute.
 */

import {
  getNextDstTransition,
  getActiveDstNotice,
  type DstDirection,
} from './lib/dst';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  ✅ ${name}`);
  } else {
    failures++;
    console.log(`  ❌ ${name}${detail ? `  — ${detail}` : ''}`);
  }
}

const TZ = 'America/New_York';

// --- Independent offset oracle (Intl, not date-fns-tz) -----------------------
function offsetMinIntl(timeZone: string, d: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = Object.fromEntries(
    dtf.formatToParts(d).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value])
  ) as Record<string, string>;
  const hour = p.hour === '24' ? 0 : Number(p.hour);
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, hour, +p.minute, +p.second);
  return Math.round((asUTC - d.getTime()) / 60000);
}

function nextTransitionIntl(from: Date, timeZone: string): { at: Date; direction: DstDirection } | null {
  const DAY = 86_400_000;
  let prevOffset = offsetMinIntl(timeZone, from);
  let prevDay = from.getTime();
  for (let i = 1; i <= 420; i++) {
    const t = from.getTime() + i * DAY;
    const o = offsetMinIntl(timeZone, new Date(t));
    if (o !== prevOffset) {
      let lo = prevDay;
      let hi = t;
      while (hi - lo > 1000) {
        const mid = Math.floor((lo + hi) / 2);
        if (offsetMinIntl(timeZone, new Date(mid)) === prevOffset) lo = mid;
        else hi = mid;
      }
      return { at: new Date(hi), direction: o > prevOffset ? 'forward' : 'back' };
    }
    prevDay = t;
    prevOffset = o;
  }
  return null;
}

// --- Tests -------------------------------------------------------------------

console.log('\nDST transition helper — lib/dst.ts\n');

// 1. Fall back 2026 (from summer): exact instant 2026-11-01T06:00:00Z, direction back.
{
  const t = getNextDstTransition(new Date('2026-07-01T00:00:00Z'), TZ);
  check('fall-back: found a transition', t !== null);
  check(
    'fall-back: instant is 2026-11-01T06:00:00Z',
    t?.at.toISOString() === '2026-11-01T06:00:00.000Z',
    t?.at.toISOString()
  );
  check('fall-back: direction is "back"', t?.direction === 'back', t?.direction);
}

// 2. Spring forward 2027 (from winter): exact instant 2027-03-14T07:00:00Z, direction forward.
//    NB: the audit doc says March 9 — that is WRONG; the real date is March 14.
{
  const t = getNextDstTransition(new Date('2026-12-01T00:00:00Z'), TZ);
  check('spring-forward: found a transition', t !== null);
  check(
    'spring-forward: instant is 2027-03-14T07:00:00Z',
    t?.at.toISOString() === '2027-03-14T07:00:00.000Z',
    t?.at.toISOString()
  );
  check('spring-forward: direction is "forward"', t?.direction === 'forward', t?.direction);
}

// 3. Non-DST zone returns null.
{
  const t = getNextDstTransition(new Date('2026-07-01T00:00:00Z'), 'UTC');
  check('UTC: no transition (null)', t === null, String(t));
}

// 4. Cross-check helper vs independent Intl oracle from several starting points.
{
  for (const from of ['2026-01-15T00:00:00Z', '2026-07-01T00:00:00Z', '2026-10-30T00:00:00Z', '2027-02-01T00:00:00Z']) {
    const mine = getNextDstTransition(new Date(from), TZ);
    const oracle = nextTransitionIntl(new Date(from), TZ);
    const sameInstant =
      mine !== null && oracle !== null &&
      Math.abs(mine.at.getTime() - oracle.at.getTime()) <= 60_000;
    const sameDir = mine?.direction === oracle?.direction;
    check(`cross-check from ${from}: matches Intl oracle`, sameInstant && sameDir,
      `helper=${mine?.at.toISOString()}/${mine?.direction} oracle=${oracle?.at.toISOString()}/${oracle?.direction}`);
  }
}

// 5. getActiveDstNotice windowing.
{
  // 3 days before fall-back → notice present, direction back, daysUntil <= 7.
  const near = getActiveDstNotice(new Date('2026-10-29T12:00:00Z'), TZ, 7);
  check('notice: shows 3 days before transition', near !== null);
  check('notice: correct direction', near?.transition.direction === 'back', near?.transition.direction);
  check('notice: daysUntil within window', (near?.daysUntil ?? 99) <= 7, String(near?.daysUntil));

  // Mid-summer, far from any transition → no notice.
  const far = getActiveDstNotice(new Date('2026-08-01T12:00:00Z'), TZ, 7);
  check('notice: hidden far from transition', far === null, String(far));

  // Just outside the window (10 days before) → no notice.
  const outside = getActiveDstNotice(new Date('2026-10-22T00:00:00Z'), TZ, 7);
  check('notice: hidden just outside 7-day window', outside === null, String(outside?.daysUntil));
}

// --- Result ------------------------------------------------------------------
console.log('');
if (failures === 0) {
  console.log('✅ ALL PASSED\n');
  process.exit(0);
} else {
  console.log(`❌ ${failures} FAILURE(S)\n`);
  process.exit(1);
}

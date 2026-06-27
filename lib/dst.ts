/**
 * Daylight Saving Time transition utilities.
 *
 * This module is intentionally free of Node-only imports (no `fs`/`path`) so it
 * is safe to import into client components such as the Scheduler. The caller
 * always passes the IANA timezone string explicitly (e.g. the `stationTimezone`
 * prop), so there is no dependency on server-side settings here.
 *
 * Offsets are computed with the built-in `Intl` API rather than date-fns-tz's
 * `getTimezoneOffset`: the latter flips its reported offset ~4h early around a
 * transition, which lands the fall-back instant on the wrong UTC time and thus
 * the wrong station-local civil date. `Intl` reports the true offset at an
 * instant. A DST transition is simply the moment that offset changes — we scan
 * forward day-by-day to find the day a change happens, then binary-search down
 * to the exact instant. Returning the exact instant (not a sampled day) matters:
 * sampling at UTC midnight mislabels the US fall-back as Nov 2 when it is really
 * Nov 1 — formatting the precise instant in station time gives the right date.
 */

/** UTC offset in minutes for `timeZone` at instant `d`, via Intl (true offset at that instant). */
function offsetMinutes(timeZone: string, d: Date): number {
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

/** 'forward' = spring forward (clocks +1h, an hour is lost). 'back' = fall back (clocks -1h, an hour repeats). */
export type DstDirection = 'forward' | 'back';

export interface DstTransition {
  /** Exact UTC instant at which the clock change occurs. */
  at: Date;
  /** Direction of the change. */
  direction: DstDirection;
}

export interface DstNotice {
  transition: DstTransition;
  /** Whole days from `now` until the transition (rounded up; 0 means it happens later today). */
  daysUntil: number;
}

const DAY_MS = 86_400_000;
// ~14 months of look-ahead: enough to always find the next US transition while
// bounding work for zones that have no DST (loop exits and returns null).
const MAX_SCAN_DAYS = 420;

/**
 * Find the next DST transition in `timeZone` at or after `from`.
 * Returns null if the zone has no offset change within the scan window
 * (e.g. UTC or other non-DST zones).
 */
export function getNextDstTransition(from: Date, timeZone: string): DstTransition | null {
  const offsetAt = (t: number) => offsetMinutes(timeZone, new Date(t));

  const start = from.getTime();
  let prevDay = start;
  let prevOffset = offsetAt(start);

  for (let i = 1; i <= MAX_SCAN_DAYS; i++) {
    const dayT = start + i * DAY_MS;
    const dayOffset = offsetAt(dayT);

    if (dayOffset !== prevOffset) {
      // The transition lies in (prevDay, dayT]. Narrow to the millisecond, then
      // snap to the nearest second to shed binary-search float residue
      // (transitions always fall on a whole minute).
      let lo = prevDay;
      let hi = dayT;
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (offsetAt(mid) === prevOffset) lo = mid;
        else hi = mid;
      }
      const at = new Date(Math.round(hi / 1000) * 1000);
      // A larger (less negative) offset means clocks moved forward.
      return { at, direction: dayOffset > prevOffset ? 'forward' : 'back' };
    }

    prevDay = dayT;
    prevOffset = dayOffset;
  }

  return null;
}

/**
 * Returns a notice when `now` is within `windowDaysBefore` days of the next DST
 * transition, otherwise null. Used to show the scheduler banner only during the
 * run-up to a change. Lead-up only by design: transitions occur ~2am local, so
 * a "no action needed" heads-up before the event is what operators want.
 */
export function getActiveDstNotice(
  now: Date,
  timeZone: string,
  windowDaysBefore = 7
): DstNotice | null {
  const transition = getNextDstTransition(now, timeZone);
  if (!transition) return null;

  const daysUntil = Math.ceil((transition.at.getTime() - now.getTime()) / DAY_MS);
  if (daysUntil > windowDaysBefore) return null;

  return { transition, daysUntil };
}

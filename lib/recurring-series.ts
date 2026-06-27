import { add } from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * Identify the recurring SERIES a slot belongs to, so each weekly series can be
 * extended independently.
 *
 * A "daily" show is modelled as several weekly series — one `recurringGroupId`
 * per weekday. Grouping by `showId` would collapse such a show down to a single
 * weekday when extending it. Grouping by series key keeps every day.
 *
 * Slots that predate `recurringGroupId` (legacy `null`) fall back to a key of
 * show + weekday + time-of-day in the station timezone, so they still extend on
 * the right day. Used by both the standalone extend script and the in-service
 * auto-extend; keep them grouping the same way by sharing this function.
 */
export function recurringSeriesKey(
  slot: { recurringGroupId: string | null; showId: string; startTime: Date },
  stationTz: string
): string {
  if (slot.recurringGroupId) return `grp:${slot.recurringGroupId}`;
  const weekday = formatTz(slot.startTime, 'EEE', { timeZone: stationTz });
  const time = formatTz(slot.startTime, 'HH:mm', { timeZone: stationTz });
  return `leg:${slot.showId}:${weekday}:${time}`;
}

export interface PlannedSlot {
  startTime: Date;
  endTime: Date;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Given the existing slots of ONE recurring series, compute the weekly slots it
 * SHOULD have between `from` and `until` that are currently MISSING.
 *
 * This both fills internal gaps (a missing week between two existing slots) and
 * extends the series forward to `until`. It is:
 *   - **idempotent** — returns only slots that don't already exist, so re-running
 *     adds nothing;
 *   - **DST-aware** — each generated slot preserves the series' station
 *     wall-clock time (e.g. a 7 PM show stays 7 PM across EDT/EST);
 *   - **pattern-based** — the most recent slot defines the weekday, wall-clock
 *     time, and duration.
 *
 * Existence is checked by station-local DATE (a weekly series has one occurrence
 * per week on its day), which is robust to the ±1h DST wobble and to a slot that
 * was nudged a few minutes. Past weeks (before `from`) are never generated.
 *
 * NOTE: requires the runtime clock to be UTC so `add({ weeks })` on the "fake
 * local" anchor steps by exactly 7×24h (Docker/Coolify default; `TZ=UTC` set).
 */
export function planMissingSeriesSlots(opts: {
  slots: { startTime: Date; endTime: Date }[];
  stationTz: string;
  from: Date;
  until: Date;
}): PlannedSlot[] {
  const { slots, stationTz, from, until } = opts;
  if (slots.length === 0 || until <= from) return [];

  // Pattern anchor: the latest slot defines weekday + wall-clock time + duration.
  const anchor = slots.reduce((a, b) => (b.startTime > a.startTime ? b : a));
  const anchorStation = toZonedTime(anchor.startTime, stationTz);
  const duration = anchor.endTime.getTime() - anchor.startTime.getTime();

  // One occurrence per week → key existing coverage by station-local date.
  const existingDates = new Set(
    slots.map((s) => formatTz(s.startTime, 'yyyy-MM-dd', { timeZone: stationTz }))
  );

  const kMin = Math.floor((from.getTime() - anchor.startTime.getTime()) / WEEK_MS) - 1;
  const kMax = Math.ceil((until.getTime() - anchor.startTime.getTime()) / WEEK_MS) + 1;

  const out: PlannedSlot[] = [];
  for (let k = kMin; k <= kMax; k++) {
    const wallClock = add(anchorStation, { weeks: k });
    const startTime = fromZonedTime(
      formatTz(wallClock, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
      stationTz
    );
    if (startTime < from || startTime > until) continue;
    const dateKey = formatTz(startTime, 'yyyy-MM-dd', { timeZone: stationTz });
    if (existingDates.has(dateKey)) continue;
    out.push({ startTime, endTime: new Date(startTime.getTime() + duration) });
  }
  return out;
}

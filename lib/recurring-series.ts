import { format as formatTz } from 'date-fns-tz';

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

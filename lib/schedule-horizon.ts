/**
 * Shared configuration for the recurring-show rolling horizon.
 *
 * Two code paths keep weekly shows generated into the future:
 *   - the recorder service auto-extend (recorder-service.ts), and
 *   - the standalone `extend-recurring-shows.ts` script.
 *
 * Both run the same gap-fill/extend pass: for every LIVE recurring series they
 * ensure there is a weekly slot every week from now through `horizonTarget(now)`
 * (or the series' existing latest slot, whichever is later). This simultaneously
 * fills internal gaps and rolls the horizon forward, so the calendar is never
 * empty far ahead and never develops holes. Keeping the value here means the two
 * paths can never drift apart.
 *
 * To change how far ahead the schedule stays populated, edit HORIZON_WEEKS.
 */

/** Keep every live recurring series populated this many weeks ahead (~18 months). */
export const HORIZON_WEEKS = 78;

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * The instant through which each live series should have a weekly slot. The
 * gap-fill/extend pass fills any missing weeks between now and here.
 */
export function horizonTarget(now: Date = new Date()): Date {
  return new Date(now.getTime() + HORIZON_WEEKS * MS_PER_WEEK);
}

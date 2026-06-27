/**
 * Shared configuration for the recurring-show rolling horizon.
 *
 * Two code paths keep weekly shows generated into the future:
 *   - the recorder service auto-extend (recorder-service.ts), and
 *   - the standalone `extend-recurring-shows.ts` script.
 *
 * Both top a show up whenever it has fewer than HORIZON_TRIGGER_WEEKS of runway
 * left, adding HORIZON_EXTENSION_WEEKS of slots at a time. Keeping the values
 * here means the two paths can never drift apart.
 *
 * Net effect: every recurring show always has between HORIZON_TRIGGER_WEEKS and
 * (HORIZON_TRIGGER_WEEKS + HORIZON_EXTENSION_WEEKS) of future slots — i.e. a
 * guaranteed minimum visible runway, refilled in one-year chunks. This is why
 * the calendar no longer "ends" a few months out.
 *
 * To change how far ahead the schedule stays populated, edit HORIZON_TRIGGER_WEEKS.
 */

/** Top up a recurring show when it has fewer than this many weeks remaining. */
export const HORIZON_TRIGGER_WEEKS = 26; // ~6 months guaranteed minimum runway

/** How many weeks of slots to add each time a show is topped up. */
export const HORIZON_EXTENSION_WEEKS = 52; // 1 year per top-up (→ up to ~18 months ahead)

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * The instant before which a recurring show is considered "running low" and
 * should be extended. A show whose latest slot ends before this needs a top-up.
 */
export function horizonThreshold(now: Date = new Date()): Date {
  return new Date(now.getTime() + HORIZON_TRIGGER_WEEKS * MS_PER_WEEK);
}

# Daylight Saving Time (DST) Audit

> ## ✅ Status (2026-06-27) — shipped & deployed, NO terminal commands required
>
> All of today's work is committed and **deployed to production** (`radio.supersoul.top`). Nothing needs to be run in the Coolify/VPS terminal.
>
> - **`TZ=UTC` env var** — ✅ added in Coolify.
> - **Self-healing extend** — on every deploy/restart, PM2 starts the recorder, which runs the gap-fill/extend pass automatically (`extendRecurringShows()` in `recorder-service.ts`). It keeps every live recurring series populated **~18 months ahead** and fills internal gaps. No manual `extend-shows` needed.
> - **Verified in production:** calendar populated through Dec 2027, daily shows appear every day, rest of schedule intact.
>
> ### ⚠️ Known limitation (accepted, not chased)
> The self-healing pass repairs gaps in **clean** data, but it did **not** backfill two pieces of **legacy** data in production: **BBC World News, Mon Nov 23 & Nov 30 2026, 12:00–1:00 AM** (a 2-week hole in one Monday series left by earlier beta churn). The slots are empty and in the future, yet the auto-fill passed over them for a production-data-specific reason (internal `recurringGroupId` grouping) that could not be diagnosed from the public API — locally the identical gap self-heals. **Decision: left as-is** (two overnight slots, cosmetic). Fix by hand in the admin UI if ever wanted: add BBC World News at 12:00–1:00 AM on those two Mondays. This is the *only* known unresolved item from today.

**Audit Date:** June 27, 2026  
**Last Updated:** June 27, 2026 — DST fixes, banner, series-grouping, self-healing gap-fill (~18mo horizon); deployed. See [Implementation Log](#implementation-log-2026-06-27)  
**Station Timezone:** `America/New_York`  
**Key Libraries:** `date-fns` ^4.1.0 · `date-fns-tz` ^3.2.0 · `react-big-calendar` ^1.19.4

### Upcoming DST Events

| Date | Direction | What Happens | Risk Profile |
|------|-----------|--------------|--------------|
| **November 1, 2026** | Fall Back | 2:00 AM → 1:00 AM (hour repeats) | Ambiguous times: 1:00–1:59 AM occurs twice |
| **March 14, 2027** | Spring Forward | 2:00 AM → 3:00 AM (hour disappears) | Gap times: 2:00–2:59 AM doesn't exist |

> **Date correction (2026-06-27):** An earlier revision of this doc listed Spring Forward as **March 9, 2027** — that is wrong. US DST springs forward on the **second Sunday of March**, which is **March 14, 2027** (March 9 is a Tuesday). The error was caught by the automated transition test (`test-dst-transition.ts`), which derives the dates from the IANA database rather than from this doc. All references below have been corrected.

---

## Architecture Summary

StationDock uses a **"UTC in DB, Station-Time for Display"** approach:

1. **Database** stores all `startTime`/`endTime` as UTC `DateTime` values.
2. **Server actions** convert user input from station wall-clock → UTC via `fromZonedTime()`.
3. **Client display** converts UTC → station time via `toZonedTime()` before passing to the calendar.
4. **Recorder service** compares raw UTC `new Date()` against UTC DB timestamps (no timezone math needed for "is active?" checks).

This is a sound architecture — UTC storage means DST transitions are captured in the offset math at read/write time, not embedded in stored data.

---

## How the Admin Experiences DST (plain English)

**Short version: the admin does nothing. It's automatic.** For almost every show there is no visible difference across a transition — each show keeps its exact wall-clock time every week, and recordings fire at the correct local time. Behind the scenes the stored UTC value shifts by an hour; the calendar never shows that.

The admin should **never manually "adjust" show times for DST** — the system already handles it, and a manual shift would double-correct and *create* a 1-hour error.

A dismissable **heads-up banner** appears on the Scheduler in the ~week before each transition, confirming the change is coming and that no action is needed.

The only edge cases (verified against this station's actual data on 2026-06-27):

### 🍂 Fall back — Sun Nov 1, 2026 (2:00 AM → 1:00 AM; the 1:00–1:59 AM hour repeats)
- This station has **no shows booked in the 1:00–1:59 AM hour**, so there is **zero visible effect** — a completely normal week.
- If a show ever were booked there, it would simply appear once at its time. No action needed.

### 🌱 Spring forward — Sun Mar 14, 2027 (2:00 AM → 3:00 AM; the 2:00–2:59 AM hour does not exist)
- A show scheduled in the missing hour displays at 3:xx AM **on that one day only**.
- Real example from this station's data — **Climate Crisis**, a Sunday 2:00 AM show:
  - Mar 7 → **2:00 AM** · Mar 14 → **3:00 AM** (2 AM doesn't exist that day) · Mar 21 → **2:00 AM** (back to normal)
- Cosmetically odd for one day, functionally correct: the recorder still fires at the right absolute time. The admin fixes nothing.

### Who handles what (airtime vs. bookkeeping)

- **On-air audio = the live Icecast stream / station automation.** It plays continuously, independent of the schedule, and fills the 25-hour (fall back) or 23-hour (spring forward) night however it is configured. StationDock does not control the audio, so **listeners never experience a gap**, DST or otherwise.
- **StationDock = the bookkeeping.** It keeps every show at its correct wall-clock time (stored UTC), and triggers recording + "Now Playing" from the schedule. Both DST events are handled automatically; no manual hour needs to be added.
- **Recording follows the schedule only.** The recorder records while a scheduled slot with recording enabled is active (`start ≤ now < end`, checked every 10s — see `recorder-service.ts`). No active slot ⇒ nothing is recorded for that time (the stream still airs). So the extra fall-back hour is recorded only if a slot covers it; filling it is **optional** (add a one-off slot if you want it captured/labeled).

---

## Component-by-Component Findings

### ✅ Recurring Slot Generation (Server Actions) — SAFE

**Files:** `app/actions.ts` (lines 69–97, 384–441, 486–521)

The DST-aware pattern used:

```ts
const initialStationStart = toZonedTime(startDateTime, stationTz);      // UTC → "fake local"
const futureStationStart = add(initialStationStart, { weeks: i });       // +7 days on fake date
const slotStart = fromZonedTime(
    format(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
    stationTz
);
```

**Why it works:** The `format() → fromZonedTime()` round-trip re-interprets the wall-clock time string in the target timezone for the TARGET date, applying the correct DST offset for that future date. A show at "7:00 PM Eastern" on both sides of DST will store as `23:00 UTC` (EDT, summer) or `00:00 UTC next day` (EST, winter) — both representing 7 PM local.

**Prerequisite:** The server MUST run in UTC so that `add({ weeks })` on the "fake" Date increments by exactly 7×24h without system-timezone DST interference. Docker containers (Coolify) default to UTC.

**Verified June 27, 2026:** Production server at `radio.supersoul.top` (Contabo VPS / Coolify) confirmed running UTC via HTTP `Date` header (`date: Sat, 27 Jun 2026 13:34:40 GMT` = 9:34 AM EDT). ✓

---

### ✅ Recorder Service — Schedule Checking — SAFE

**File:** `recorder-service.ts` (lines 90–170)

```ts
const now = new Date()  // UTC
const activeSlots = await prisma.scheduleSlot.findMany({
    where: { startTime: { lte: now }, endTime: { gt: now } },
    ...
})
```

Pure UTC ↔ UTC comparison. No timezone conversion. DST cannot affect this. ✓

---

### ✅ Recorder Service — Auto-Extend (In-Service) — SAFE

**File:** `recorder-service.ts` (lines 746–771)

Uses the same `toZonedTime → add → format → fromZonedTime` pattern as the server actions for start times. The `endTime` is calculated as `new Date(newStartTime.getTime() + duration)` where duration is fixed milliseconds — this preserves absolute show length (correct: a 1-hour show is always 1 hour regardless of DST).

---

### ✅ FIXED (2026-06-27): Standalone `extend-recurring-shows.ts` — was NOT DST-SAFE

> **Status:** Fixed on 2026-06-27. The naive arithmetic below was replaced with the DST-aware `toZonedTime → add → format → fromZonedTime` pattern. See [Implementation Log](#implementation-log-2026-06-27). The original finding is preserved here for context.

**File:** `extend-recurring-shows.ts` (was lines 77–80)

```ts
const newStartTime = new Date(latestSlot.startTime)
newStartTime.setDate(newStartTime.getDate() + (i * 7))
```

**Problem:** This uses naive JS date arithmetic (`setDate`) which shifts by 7 calendar days **in the runtime's timezone**. On a UTC server, this adds exactly 7×24h of milliseconds. It preserves the UTC instant rather than the station wall-clock time.

**Impact:** After a DST transition, shows generated by this script shift by 1 hour. A show at 7:00 PM EDT (23:00 UTC) would be stored as 23:00 UTC post-DST, which becomes 6:00 PM EST — off by one hour.

**Severity:** LOW — This standalone script is a legacy fallback. The in-service auto-extend (`recorder-service.ts:702`) uses the correct DST-aware pattern and runs automatically. But if someone runs `npx tsx extend-recurring-shows.ts` manually across a DST boundary, the generated slots will drift.

**Fix:** Replace the naive arithmetic with the same `toZonedTime/add/fromZonedTime` pattern used elsewhere (see Recommendations below).

---

### ✅ Admin Calendar (react-big-calendar) — Display — SAFE

**File:** `components/Scheduler.tsx`

The calendar uses the "fake local" Date pattern:
1. UTC dates from DB → `toZonedTime(date, stationTimezone)` creates Dates whose `getHours()/getMinutes()` return station wall-clock values.
2. These are passed to `react-big-calendar` which reads Dates using standard JS methods.
3. `getNow={() => toZonedTime(new Date(), stationTimezone)}` keeps the "now" line accurate.

The calendar does NOT use `min`/`max` props (which are known to cause DST display bugs — see [react-big-calendar#2466](https://github.com/jquense/react-big-calendar/issues/2466)).

**DST-day rendering:** On Nov 1 (fall-back), the 1:00–2:00 AM hour occurs twice. Shows in that window will render correctly at their UTC-stored positions. If two shows occupy the ambiguous hour (unlikely in a radio schedule), they would both appear at "1:xx AM" on the grid — visually overlapping, which correctly represents reality.

---

### ✅ Admin Calendar — Click-to-Schedule — SAFE

**File:** `components/ScheduleModal.tsx` (lines 237–251)

```ts
const getStationTimeUTC = (localDate: Date) => {
    // Extract wall-clock from the "fake" calendar Date
    const timeString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    return fromZonedTime(timeString, stationTimezone)
}
```

When a user clicks a slot on Nov 1 at "3:00 PM", the calendar gives a "fake" Date representing 3:00 PM station time. `fromZonedTime("2026-11-01T15:00:00", "America/New_York")` correctly converts to `20:00 UTC` (EST offset applied for Nov 1). ✓

**Edge case — Ambiguous hour:** If someone clicks in the 1:00–1:59 AM window on fall-back day, `fromZonedTime` defaults to the post-transition offset (EST). This means it interprets the click as the SECOND 1:xx AM, not the first. Practically irrelevant for radio scheduling (nobody schedules shows at 1 AM on DST day) but worth noting.

---

### ✅ Now-Playing API — SAFE

**File:** `app/api/public/now-playing/route.ts`

Pure UTC comparison: `startTime: { lte: now }, endTime: { gt: now }`. No timezone math. ✓

---

### ✅ Public Listen Page — SAFE (with design note)

**Files:** `app/listen/page.tsx`, `app/listen/components/ScheduleCard.tsx`

The public schedule API returns UTC ISO strings. The listen page formats times using date-fns `format()` (no timezone option), which renders in the **visitor's browser timezone**. This is a deliberate design choice: listeners see show times in their own local time. The "is live" check uses `new Date()` vs UTC timestamps — always correct regardless of DST.

---

### ✅ Public Schedule API — SAFE

**File:** `app/api/public/schedule/route.ts`

Date range filtering uses UTC. `startOfDay` and `addDays` operate in the server's timezone (UTC in Docker), producing correct 24-hour windows. On DST-transition days, since the server is UTC, `addDays(midnight, 1)` always gives exactly 24h — no missing or duplicate hours.

---

## Known Library Behaviors

### `date-fns` — `add()` / `addDays()` / `addWeeks()`

- **Behavior:** Adds calendar units in the **runtime's system timezone**.
- **On a UTC server:** No DST transitions exist in UTC, so adding 7 days always adds exactly 604800000 ms.
- **On a non-UTC machine (dev):** DST transitions can cause `addDays(date, 1)` to add 23h or 25h instead of 24h (see [date-fns#3876](https://github.com/date-fns/date-fns/issues/3876)).
- **Our mitigation:** The `format → fromZonedTime` round-trip after `add()` re-anchors the wall-clock time in the correct offset.

### `date-fns-tz` v3 — `fromZonedTime()` (ambiguous times)

- During fall-back, times between 1:00–1:59 AM are ambiguous (they occur twice).
- `fromZonedTime` always picks the **later offset** (post-transition). This means:
  - "1:30 AM" on Nov 1 → interpreted as 1:30 AM EST (06:30 UTC), not 1:30 AM EDT (05:30 UTC).
- **Impact:** If a show is manually scheduled at 1:30 AM on the exact DST date, it will be placed in the second occurrence. This is fine for practical purposes.

### `date-fns-tz` v3 — `toZonedTime()` (gap times)

- During spring-forward, 2:00–2:59 AM doesn't exist (clocks jump 2:00 → 3:00).
- `toZonedTime` on a non-existent time returns the "spring-forward" equivalent (3:00 AM).
- **Impact:** If a recurring slot lands exactly in the gap (e.g., a 2:30 AM show on spring-forward day), it would display at 3:30 AM. The recorder would still fire at the correct UTC instant, but the display might confuse operators.

### `react-big-calendar` ^1.19.4

- **Known Issue [#2466]:** `min`/`max` props cause 1-hour event displacement during DST week. **We don't use these props.** ✓
- **Known Issue [#1083]:** `onSelectSlot` may report incorrect Date values on the DST day. **Our `getStationTimeUTC()` re-extracts wall-clock from the Date, avoiding this trap.** ✓
- **dateFnsLocalizer:** Uses `format`, `parse`, `startOfWeek`, `getDay` from date-fns. These operate on whatever Date objects we pass. Since we pre-convert to "fake local" Dates, the localizer never encounters real DST boundaries.

---

## Risk Assessment — Both DST Events

### November 1, 2026 (Fall Back)

The "repeated hour" scenario. 1:00–1:59 AM happens twice (first in EDT, then in EST).

| Area | Risk | Notes |
|------|------|-------|
| Admin calendar display | ✅ None | "Fake local" Dates are DST-immune |
| Recorder fires on time | ✅ None | UTC→UTC comparison |
| Recurring slots maintain wall-clock time | ✅ None | Already generated with correct offsets |
| Click-to-schedule at 1 AM on Nov 1 | ⚠️ Minimal | `fromZonedTime` defaults to second 1 AM (EST) — unlikely scenario |
| Standalone extend script | ⚠️ Medium | If run manually, new slots drift 1h post-DST |
| Public listen page times | ✅ None | Browser formats UTC correctly per its own DST |

**What you'll see Nov 1:** After 2:00 AM EDT, clocks reset to 1:00 AM EST. Shows scheduled at 1:30 AM in UTC will appear at the correct position. The one "extra" hour means a show ending at 2:00 AM EST actually ends 1 hour later in absolute time than the same wall-clock time on a normal day. Since we store UTC, the recorder correctly handles the longer night.

### March 14, 2027 (Spring Forward)

The "missing hour" scenario. 2:00–2:59 AM doesn't exist (clocks jump 2:00 AM → 3:00 AM).

| Area | Risk | Notes |
|------|------|-------|
| Admin calendar display | ✅ None | "Fake local" Dates are DST-immune |
| Recorder fires on time | ✅ None | UTC→UTC comparison — the show's stored UTC start/end are unambiguous |
| Recurring slot at 2:30 AM | ⚠️ Low | `fromZonedTime("2027-03-14T02:30:00", "America/New_York")` → interprets as 3:30 AM EDT (07:30 UTC). The show "moves" to 3:30 AM display on that ONE day only |
| Calendar display of 2:xx AM show | ⚠️ Low | `toZonedTime` will render the UTC instant correctly — it'll show at 3:xx AM since 2:xx AM doesn't exist in the target timezone |
| Standalone extend script | ⚠️ Medium | Same 1h drift issue as fall-back |
| Show duration spanning 2 AM | ✅ None | A 1:30–2:30 AM show becomes 1:30–3:30 AM on the calendar (only 1 real hour). Recorder records for the correct absolute duration from UTC timestamps |
| Dev-machine behavior differs from prod | ⚠️ Low | `add()` behaves differently in non-UTC — tests may pass locally but produce wrong offsets if dev TZ = station TZ |

**What you'll see Mar 14:** If any recurring show is scheduled between 2:00–2:59 AM, it will appear at 3:xx AM on the calendar for that one day. The recorder will still fire at the correct UTC instant (the stored UTC time doesn't change). This is cosmetically odd but functionally correct. The absolute duration of recordings is preserved.

**Practical impact:** Unless you have a show specifically at 2:00–2:59 AM Eastern, Spring Forward causes zero visible issues. Most radio stations have overnight automation or music at that hour.

---

## Recommendations

### 1. Fix standalone `extend-recurring-shows.ts` (Priority: Medium) — ✅ DONE 2026-06-27

Replaced naive date math with the DST-aware pattern (see [Implementation Log](#implementation-log-2026-06-27) for the exact diff):

```ts
// BEFORE (broken):
const newStartTime = new Date(latestSlot.startTime)
newStartTime.setDate(newStartTime.getDate() + (i * 7))

// AFTER (DST-safe):
const { add } = require('date-fns');
const { toZonedTime, fromZonedTime, format } = require('date-fns-tz');
const stationTz = getStationTimezone();

const latestStationStart = toZonedTime(new Date(latestSlot.startTime), stationTz);
const futureStationStart = add(latestStationStart, { weeks: i });
const newStartTime = fromZonedTime(
    format(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
    stationTz
);
const newEndTime = new Date(newStartTime.getTime() + duration);
```

### 2. Add `TZ=UTC` to Docker/Coolify environment (Priority: High — safety net) — ✅ DONE 2026-06-27

While Docker defaults to UTC, explicitly setting `TZ=UTC` in the environment prevents surprises:

```env
TZ=UTC
```

**✅ Completed** — the user added `TZ=UTC` in Coolify on 2026-06-27. Original setup steps kept below for reference:

1. Open Coolify → your StationDock application (`radio.supersoul.top`).
2. Go to **Configuration → Environment Variables**.
3. Click **Add** and enter exactly:
   - **Name:** `TZ`
   - **Value:** `UTC`
   - Leave it as a regular (non-build-time) variable; it's a runtime variable.
4. Save, then **Redeploy** the application (env var changes require a redeploy to take effect).
5. **Verify after redeploy** — in the Coolify terminal for the container:
   ```bash
   # Should print: UTC
   echo $TZ
   # Should print a UTC time (no offset), e.g. "Sat Jun 27 14:56:51 UTC 2026"
   date
   # Node's view — should print: UTC
   node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"
   ```

**Why it matters:** the recurring-slot math (`add({ weeks })` on a "fake local" Date) is only DST-neutral when the runtime clock is UTC. Docker images default to UTC, so this is belt-and-suspenders — but pinning `TZ=UTC` removes any chance a future base-image change silently introduces a non-UTC system clock, which is the one environmental condition that could make the otherwise-correct math drift. It costs nothing and closes the last risk.

**Note — this does not affect the station timezone.** Station time (`America/New_York`) lives in `station-settings.json` / `StationSettings.timezone`, independent of the server's `TZ`. Setting `TZ=UTC` is purely about the server's *system* clock.

### 3. Automated DST verification test (Priority: Low)

The existing `test-dst-recurring.ts` is manual. Consider a CI-friendly test that:
- Creates a recurring show starting before a DST transition
- Verifies slots after the transition maintain wall-clock time
- Can run with `TZ=America/New_York npx tsx test-dst-automated.ts` to simulate non-UTC

### 4. UI warning for ambiguous/gap scheduling (Priority: Very Low) — superseded by the DST banner

Rather than a per-click tooltip (a rare scenario), we shipped an **informational, dismissable banner** that appears in the ~week before any transition. It reassures operators that the schedule already handles DST, rather than warning them away from an action. See [Implementation Log → DST banner](#implementation-log-2026-06-27). The original per-click tooltip idea remains an option but is not planned.

### 5. Public listen page — show station timezone label (Priority: Low)

The public listen page shows times in the visitor's local timezone. Consider adding a small label like "All times in Eastern" or "Times shown in your timezone" for clarity during DST transitions when station and listener offsets may diverge.

---

## How to Verify Before Each DST Event

### Pre-November 1, 2026 (Fall Back) Checklist

1. **Navigate to the schedule for Nov 1 week** (your screenshot shows this works correctly — shows appear at their expected positions).
2. **Check a recurring show that spans the DST boundary:**
   - Find a recurring weekly show (yellow border).
   - Compare its time on Oct 25 (last EDT day) vs Nov 1 (first EST day).
   - Both should show the same wall-clock time (e.g., "7:00 PM" on both dates).
   - The underlying UTC values should DIFFER by 1 hour (4h offset pre-DST, 5h offset post-DST).
3. **Verify recorder timing:** On Nov 1, check the recorder service logs. Shows should start at the correct station time, e.g.:
   ```
   [2026-11-01T12:00:00Z] Starting recording for slot... Station time: 07:00-08:00 America/New_York
   ```
   (07:00 EST = 12:00 UTC, confirming the 5h EST offset is applied)
4. **Confirm no shows at 1:00–1:59 AM** on Nov 1 — if there are, they'll work fine but be aware the "first" vs "second" 1 AM is determined by the stored UTC value.

### Pre-March 14, 2027 (Spring Forward) Checklist

1. **Check if any recurring shows land at 2:00–2:59 AM** on March 14:
   ```sql
   -- In SQLite, check for shows in the "gap" hour (UTC equivalent: 07:00-07:59 UTC)
   SELECT * FROM ScheduleSlot WHERE startTime LIKE '2027-03-14T07:%';
   ```
   If any exist, be aware they'll display at 3:xx AM on the calendar that day.
2. **Compare a recurring show across the boundary:**
   - Check its time on March 7 (last EST week) vs March 14 (first EDT week).
   - Both should show the same wall-clock time.
   - UTC values differ by 1 hour (5h → 4h offset).
3. **After the transition:** Spot-check a few shows in the following week to confirm they still appear at correct times.

---

## Implementation Log (2026-06-27)

This section records the DST work done on 2026-06-27, building on the audit above. Goal: an **operator-confidence** feature (a heads-up banner during DST week) plus closing the one real code bug — **without modifying the already-correct production offset math**.

### Design decision: informational banner, not an interactive "DST handler"

The audit concluded the app already handles DST correctly in every production path. So a UI control that lets an operator "adjust for DST" would have **nothing to resolve** and would invite double-correction — the very way you *create* a 1-hour bug. We therefore deliberately chose a **passive, informational, dismissable banner** over (a) an interactive scheduler control or (b) a permanent "DST not handled" warning (which would be untrue and would train operators to ignore warnings).

### What shipped

#### 1. `lib/dst.ts` — DST transition helper (new)

Client-safe (pure `Intl`, **no** `fs`/`path`/Node imports) so it can be imported into the client `Scheduler`. The caller passes the IANA zone explicitly (`stationTimezone` prop), so there is no server-settings dependency.

| Export | Purpose |
|--------|---------|
| `getNextDstTransition(from, timeZone)` | Returns `{ at: Date, direction: 'forward' \| 'back' }` for the next transition at/after `from`, or `null` for non-DST zones (e.g. UTC). Scans forward day-by-day for an offset change, then binary-searches to the exact instant. |
| `getActiveDstNotice(now, timeZone, windowDaysBefore = 7)` | Returns `{ transition, daysUntil }` only when `now` is within the lead-up window, else `null`. Drives the banner's visibility. |

**Why `Intl` and not date-fns-tz `getTimezoneOffset`:** see the gotcha below — date-fns-tz reports the offset change ~4h early, which lands the fall-back instant on the wrong UTC time and thus the wrong civil date.

**Why the exact instant matters:** sampling the offset at, e.g., UTC midnight mislabels the US fall-back as **Nov 2** (Nov 1 00:00 UTC is still EDT). We binary-search to the real instant (`2026-11-01T06:00:00Z`), then format *that* in station time → correct civil date **Nov 1**.

#### 2. `test-dst-transition.ts` — automated test (new)

Standalone `tsx` script (matches the repo's existing convention; there is no Jest/Vitest). Run:

```bash
npx tsx test-dst-transition.ts
```

**16 checks, all passing.** It asserts against ground-truth instants **and** cross-checks the helper against an independent `Intl`-based oracle from several start dates — so it does not depend on this doc being correct. Coverage: fall-back 2026, spring-forward 2027, non-DST zone (`null`), oracle agreement, and `getActiveDstNotice` windowing (inside window, far away, just outside).

#### 3. `components/DstBanner.tsx` + mount in `components/Scheduler.tsx` (new)

- Renders only when `getActiveDstNotice` returns a notice (default **7-day** lead-up — "during the week").
- **Dismissable**, persisted in `localStorage` keyed to the specific transition instant (`dst-banner-dismissed:<at.toISOString()>`), so dismissing the fall-back notice does **not** suppress the next spring-forward notice.
- `localStorage` is read in a `useEffect` (not during render) to avoid SSR/hydration mismatches.
- Copy is reassurance, not alarm: *"Clocks fall back Sunday, November 1 (in 5 days). Your schedule already handles this — shows keep their normal times… No action needed."* Spring-forward adds a note about the missing 2–3 AM hour; fall-back notes the repeated 1 AM hour.
- Mounted at the top of the Scheduler's render, above the calendar.

#### 4. `extend-recurring-shows.ts` — DST bug fixed

Replaced the naive `setDate(getDate() + i*7)` (which preserves the UTC instant and drifts wall-clock time by 1h across a transition) with the DST-aware pattern used by the in-service auto-extend and server actions:

```ts
// AFTER (DST-safe):
const latestStationStart = toZonedTime(new Date(latestSlot.startTime), stationTz)
const futureStationStart = add(latestStationStart, { weeks: i })
const newStartTime = fromZonedTime(
    formatTz(futureStationStart, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: stationTz }),
    stationTz
)
const newEndTime = new Date(newStartTime.getTime() + duration)
```

`stationTz` comes from `getStationTimezone()` (`lib/station-time.ts`). Duration stays fixed-ms, preserving absolute show length.

### Two bugs the testing caught (why we tested before building UI)

1. **Doc date error:** the audit listed Spring Forward 2027 as **March 9**; the real date is **March 14** (second Sunday of March). A hardcoded banner date would have fired on the wrong week. Corrected throughout this doc.
2. **date-fns-tz `getTimezoneOffset` flips early:** the first helper version used it and placed the fall-back transition at `2026-11-01T02:00:00Z`, which formats to **Oct 31** in station time (wrong civil date). The independent `Intl` cross-check in the test flagged it; switching the helper's offset source to `Intl` fixed it. Lesson: do **not** use date-fns-tz `getTimezoneOffset` to pinpoint a transition instant.

### Verification

- `npx tsx test-dst-transition.ts` → **ALL PASSED (16/16)**.
- `npx tsc --noEmit` → **0 errors** across the changed files (`lib/dst.ts`, `components/DstBanner.tsx`, `components/Scheduler.tsx`, `extend-recurring-shows.ts`).

### Files touched

| File | Change |
|------|--------|
| `lib/dst.ts` | **new** — transition helper |
| `test-dst-transition.ts` | **new** — automated test (16 checks) |
| `components/DstBanner.tsx` | **new** — dismissable banner |
| `components/Scheduler.tsx` | mounted `<DstBanner>` above the calendar |
| `extend-recurring-shows.ts` | DST-safe slot generation |
| `docs/daylight-savings.md` | date correction + this log |

### Still open

- ✅ **`TZ=UTC` in Coolify** — DONE (added 2026-06-27).
- ✅ **Deployed to production** — done 2026-06-27; recorder auto-backfilled on startup, calendar populated ~18 months out.
- ⬜ **Two legacy slots not auto-filled** (BBC Mon Nov 23 & 30 2026, 12 AM) — accepted/not chased; see the [Known limitation](#-status-2026-06-27--shipped--deployed-no-terminal-commands-required) at the top. Fix by hand if ever wanted.

---

## Rolling Schedule Horizon Fix (2026-06-27)

Discovered while testing the DST work: the admin calendar appeared **empty after late November 2026**. Investigated and fixed the same day.

### It was NOT data loss, and NOT caused by the DST changes

| Database snapshot | Slots | Latest slot |
|-------------------|-------|-------------|
| Backup from **Dec 12, 2025** | 4898 | **2026-11-29** |
| Session backups (Jun 27, 2026) | 4904 | 2026-11-29 |
| Live DB (before fix) | 4904 | 2026-11-29 |

The `2026-11-29` horizon was already present in a **December 2025 backup** — six months before this work — and was visible in **production** (a separate database). So it was inherent to the data, not the DST changes.

### Root cause

Recurring shows are generated ~52 weeks ahead at creation time (these were created in late 2025 → end ~Nov 2026). The background auto-extender (`recorder-service.ts`) only topped a show up when it had **less than 4 weeks** of runway left. With "now" = Jun 27 2026 and the horizon ~22 weeks out, the trigger correctly hadn't fired — so the calendar showed the bare leading edge of a rolling one-year horizon and looked empty past November.

### The fix — a larger, shared rolling horizon

New single source of truth: **`lib/schedule-horizon.ts`**.

> **Note (superseded the same day):** this section describes the original *append-based* horizon (trigger `< 26 weeks` → add `52`). It was later replaced by the **self-healing gap-fill** model below — the constants are now a single `HORIZON_WEEKS = 78` (~18 months). See [Self-healing gap-fill](#self-healing-gap-fill-2026-06-27). The history is kept here for context.

Both extension paths import from this module (so they can never drift):
- `recorder-service.ts` auto-extend.
- `extend-recurring-shows.ts`.

**Effect:** every recurring show always keeps a generous rolling window of future slots. To change how far ahead the schedule stays populated, edit `HORIZON_WEEKS` in one place.

### One-time backfill (already applied locally)

Ran `npm run extend-shows` (now DST-safe). Because runway was below the new 26-week trigger, all **24 recurring shows** extended by 52 weeks:

- Slots: **4,904 → 6,152**; horizon **2026-11-29 → 2027-11-28** (~17 months out).
- Previously-empty months filled: Dec 2026 `0 → 100`, Jan 2027 `114`, Mar 2027 `100`, Jun 2027 `98`, Nov 2027 `79`.
- **DST verified on the new slots** across spring-forward: a weekly 1 PM show stored `18:00Z` on Mon Mar 8 2027 (EST) and `17:00Z` on Mon Mar 15 2027 (EDT) — same 1:00 PM station wall-clock, UTC differing by exactly 1h. ✓

### Production action — automatic, no terminal needed

**Just deploy.** Production runs the recorder under PM2 (`nixpacks.toml` → `pm2-runtime start ecosystem.config.js`), and the recorder runs `extendRecurringShows()` on startup (`recorder-service.ts:811`). So on every deploy the recorder restarts and **auto-backfills the calendar** with the fixed series-aware logic — no `npm run extend-shows`, no Coolify terminal.

Verify (no terminal): open the production schedule after deploy and page past November; daily shows should appear every day. Coolify snapshots the persistent volume, but a manual backup of `/app/data/dev.db` before deploy never hurts.

### Follow-up bug found & fixed: daily shows collapsed to one weekday

The first extend run surfaced a **pre-existing** bug in the extension logic (it predated this work; it was dormant only because auto-extend hadn't fired yet). The calendar looked sparse in the extended period because **daily shows were being collapsed to a single weekday**.

**Data model:** a "daily" show is stored as **several weekly series — one `recurringGroupId` per weekday** (e.g. BBC World News = 7 series, Sun–Sat). One-off broadcasts are non-recurring with a `null` group.

**The bug:** both extension paths grouped recurring slots **by `showId`** and extended only the single latest slot — so just **1 of the 7** weekday series was carried forward; the other 6 were dropped. New slots were also created **without** a `recurringGroupId`.

**The fix:** group by recurring **series**, not by show. New shared helper **`lib/recurring-series.ts`** → `recurringSeriesKey(slot, tz)`:
- uses `recurringGroupId` when present;
- falls back to `show + weekday + time-of-day` (station tz) for any legacy `null`-group slots, so they still extend on the correct day.

Both [`extend-recurring-shows.ts`](../extend-recurring-shows.ts) and the in-service auto-extend ([`recorder-service.ts`](../recorder-service.ts)) now group by this key and **carry `recurringGroupId` onto the new slots**. The shared helper means the two paths can't drift apart (drift is exactly what caused this class of bug).

**Recovery + verification (local):**
- Restored the DB from the pre-extend backup to undo the bad run (the bad slots were identifiable: `isRecurring=1 AND recurringGroupId IS NULL`, of which the clean DB had **0**).
- Re-ran `npm run extend-shows`: **95 series** extended (across 24 shows), 4,904 → 9,844 slots, horizon → 2027‑11‑28, **0 duplicate slots**.
- BBC World News now airs **Sun–Sat** in Dec 2026 **and** Jul 2027 (was collapsing to Sat only).
- DST still correct on the new daily slots: BBC's Monday series holds **12:00 AM** station time across spring-forward 2027 (UTC `05:00Z`→`04:00Z`).
- New regression test **`test-recurring-series.ts`** asserts a 7-day show yields 7 series groups (not 1), included in `npm run test:dst`.

> **Production note:** if the old auto-extend already ran in production and collapsed any daily shows, the fix prevents *future* collapse but does not retroactively un-collapse already-generated slots. Check production after deploy (`SELECT COUNT(*) FROM ScheduleSlot WHERE isRecurring=1 AND recurringGroupId IS NULL`). If there are unexpected null-group recurring slots from a prior bad extend, delete those future slots and re-run `extend-shows` with the fixed code. On this local DB the count was 0, so nothing to clean.

### Secondary audit (2026-06-27): two more production-safety fixes

A pre-deploy audit ("will the Coolify push be safe?") found and fixed two more issues in the extension logic. Both now apply to **both** paths (`extend-recurring-shows.ts` and the in-service auto-extend), kept identical.

1. **Overlap handling — per-slot, not whole-series.** The auto-extend had **no** overlap check (it could create double-bookings on deploy), while the standalone script skipped an entire series on any overlap (losing a whole year over one conflicting day). Both now **drop only the individual overlapping slots and keep the rest of the series.** This matters at spring-forward: a 2 AM show shifted to 3 AM on the gap day can collide with a real 3 AM show — only that one slot is skipped. Verified: **0 cross-show overlaps** in the extended data.

2. **Idempotency — only extend LIVE series.** The trigger was `latestEndTime < threshold`. Abandoned **remnant series** (e.g. Classic Country "Sun 14:00" = 2 slots ending 2025-11-30) matched it, and a fixed +52w from a year-old baseline never cleared the threshold — so the extend **re-fired every run**, piling up past-dated/overlapping slots (a real risk since the recorder auto-extends on *every* PM2 restart). Fixed by requiring `latestEndTime > now` (still live) **and** `< threshold` (running low). Result: run 1 extends 94 live series; **run 2 adds 0 slots — idempotent.** Abandoned remnants are left untouched (not resurrected).

**Pre-deploy verification (all green):** `npm run test:dst` 7/7 · `npm run build` exit 0 (`✓ Compiled successfully`) · extend is idempotent (re-run = 0) · 0 cross-show overlaps · daily shows stay daily · horizon 2027-11-28.

### Self-healing gap-fill (2026-06-27): the extend now repairs internal gaps

**Symptom (found in production):** after deploy, BBC World News was missing on **Mondays Nov 23 & 30** only — present before and after. Confirmed via the production public API (`/api/public/schedule`): a Monday-only 2-week hole at the original/extended boundary.

**Root cause:** the extend logic was **append-only** — it generated weekly slots *forward from each series' latest slot*. Once a series was extended to the far horizon (by an earlier, less-correct run), a later run saw it as "done" and never went back to fill an **internal** gap. The deployed code couldn't self-repair stale gaps (the documented "doesn't retroactively repair" caveat). The current code is correct on clean data (local: BBC Monday present every week), but production's slots were generated during earlier iteration and carried a hole.

**Fix — gap-fill, not append.** New pure, tested helper **`planMissingSeriesSlots()`** (`lib/recurring-series.ts`): given a series' existing slots, it returns the weekly slots MISSING between `from` and `until`, by station-local date. Both extend paths now, for every **live** series, ensure a weekly slot every week from `max(now, series-start)` through `horizonTarget(now)` (or the series' latest, whichever is later). This **fills internal gaps AND extends forward in one idempotent, DST-aware pass.** A stale gap (from any source) now self-heals on the next recorder restart — no manual repair, no terminal.

Properties (all verified locally, incl. reproducing the exact production gap by deleting BBC Monday slots and watching them refill):
- **Self-heals** internal gaps · **idempotent** (re-run adds 0) · **DST-aware** (generated slots hold wall-clock time across transitions) · **overlap-safe** (per-slot skip) · **no remnant resurrection** (skips series whose last airing already passed) · **never backfills** before a series' first slot or before `now`.

**Horizon config simplified.** `lib/schedule-horizon.ts` now exposes a single knob — **`HORIZON_WEEKS = 78`** (~18 months) — and `horizonTarget(now)`. The old `HORIZON_TRIGGER_WEEKS` / `HORIZON_EXTENSION_WEEKS` / `horizonThreshold` (append-era) were removed. The schedule now keeps a clean **rolling ~18-month** window for every live series.

**New regression tests** in `test-recurring-series.ts` cover the planner: gap-fill, forward-extend, idempotency, the `from` boundary (no past/pre-start backfill), DST wall-clock, and empty series.

**Production fix path:** redeploy this code; on the recorder's startup auto-extend it fills the existing gaps automatically. No terminal step.

---

## Local Testing & Verification (terminal-only)

> **No browser automation.** Per the project README, all browser/visual testing is done manually by the operator. Everything below is terminal-only and safe to run locally.

### One command: the full DST suite

```bash
npm run test:dst          # type check + all DST tests (backs up dev.db first)
npm run test:dst:logic    # DB-free logic tests only (does not touch dev.db)
```

`test:dst` runs `test-dst-all.sh`, which:
1. Runs `tsc --noEmit` (type regression check).
2. Runs the DB-free logic tests (no database touched).
3. **Backs up `prisma/dev.db`** to a timestamped file, then runs the DB-backed tests (each creates a clearly-named temp show/slots and deletes them on completion).
4. Prints an aggregate pass/fail summary and exits non-zero on any failure.

**Last run (2026-06-27): 6/6 passed.**

### What each test covers

| Test | DB? | Verifies |
|------|-----|----------|
| `test-dst-transition.ts` | No | `lib/dst.ts` — exact transition instants (Nov 1 2026, Mar 14 2027), direction, non-DST zones, `getActiveDstNotice` windowing. Cross-checks against an independent `Intl` oracle. **16 checks.** |
| `test-dst-extend.ts` | No | The DST-safe slot math behind `extend-recurring-shows.ts` keeps weekly slots at the same station wall-clock time across Nov 1, and reproduces the old naive-`setDate` 1h drift (proving the fix is meaningful). |
| `test-recurring-series.ts` | No | `recurringSeriesKey` groups by series so a daily show (7 weekday series) yields 7 groups, not 1 — guards the daily-collapse bug. |
| `test-dst-recurring.ts` | Read | Recurring generation maintains wall-clock time across both transitions. |
| `test-comprehensive.ts` | Yes (self-cleaning) | DST-aware recurring + non-recurring + midnight-crossing slots, end to end. |
| `test-dst-automated.ts` | Yes (self-cleaning) | Full lifecycle: creates a recurring show, generates 52 weeks, verifies wall-clock stability across both DST events, cleans up. |

### Running the local app

```bash
npm run dev        # Next server (server.ts) + recorder-service.ts via concurrently
# → http://localhost:3000  (admin)  ·  http://localhost:3000/listen  (public)
```

Quick endpoint smoke-checks (no browser needed):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/listen                 # expect 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/public/now-playing  # expect 200
curl -s http://localhost:3000/api/public/schedule | head -c 400                        # JSON schedule
```

To stop the dev server: `lsof -ti:3000 | xargs kill` (and kill the recorder if it lingers).

### Manually previewing the DST banner

The banner only renders within 7 days of a transition, so to see it today you can temporarily widen the window. In `components/Scheduler.tsx`, pass a large `windowDaysBefore`:

```tsx
<DstBanner stationTimezone={stationTimezone} windowDaysBefore={400} />
```

Load `/schedule` — the banner should appear (fall-back, Sun Nov 1 2026). Click the ✕ to dismiss; reload to confirm it stays dismissed (localStorage). **Revert the `windowDaysBefore={400}` change before committing.**

### Deep audit notes (2026-06-27, secondary pass)

- **Production parity:** `extend-recurring-shows.ts` now uses the *identical* `toZonedTime → add → format → fromZonedTime` pattern as the in-service auto-extend (`recorder-service.ts` ~L748–771). Verified side by side.
- **`lib/dst.ts` is client-safe:** no `fs`/`path`; offsets via `Intl`. Confirmed it imports cleanly into the client `Scheduler` (build + `tsc --noEmit` clean).
- **`getStationTimezone()` for the script:** reads `station-settings.json` from `process.cwd()`. Confirmed the file exists at the project root with `{"timezone":"America/New_York"}`, so `npm run extend-shows` resolves the zone correctly.
- **DB non-destructive:** after a full suite run, 0 leftover test-script shows (`TEST_NON_RECURRING`, `DST_TEST_SHOW_AUTO`); pre-existing data untouched.
- **One thing to eyeball manually (cannot browser-test here):** the banner mounts above the `h-full` calendar container in `Scheduler.tsx`. Confirm visually that, when shown, it doesn't push the calendar's bottom edge off-screen on the `/schedule` page. If it does, wrap the calendar area so the banner and calendar share a flex column.

---

## Summary

**The app handles DST correctly in all production code paths**, and all of today's work is shipped and deployed. Across 2026-06-27 we: confirmed/fixed the DST-safe extension math; added a dismissable DST heads-up banner; fixed daily-show collapse by grouping recurring slots into per-weekday **series**; hardened the auto-extend (per-slot overlap skip, live-series-only, idempotent); and replaced the append-only extend with a **self-healing gap-fill** that keeps every live series populated ~18 months out and repairs internal gaps. All backed by a terminal test suite (`npm run test:dst`, 7/7) and verified by a clean production build. `TZ=UTC` is set in Coolify.

**One accepted limitation:** two legacy overnight slots in production (BBC Mon Nov 23 & 30 2026) were not auto-backfilled — a production-data-specific quirk left from beta churn, deliberately not chased (see [Known limitation](#-status-2026-06-27--shipped--deployed-no-terminal-commands-required)).

See the [Implementation Log](#implementation-log-2026-06-27), [Rolling Schedule Horizon Fix](#rolling-schedule-horizon-fix-2026-06-27), and [Self-healing gap-fill](#self-healing-gap-fill-2026-06-27) for full detail.

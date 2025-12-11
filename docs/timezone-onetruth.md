# Station Timezone "One Truth" Architecture & Implementation Plan

## Executive Summary

**Goal**: Implement a single, station-wide timezone that governs all scheduling, recording, and display operations. All users—regardless of their location—see and interact with times in the station's timezone.

**Current Status**: 
- ✅ Station timezone is configurable in Settings UI
- ✅ Clock component displays station time
- ❌ Schedule creation uses server's local timezone
- ❌ Schedule display uses viewer's browser timezone
- ❌ Recorder service uses server's local timezone
- ❌ Date inputs are interpreted in browser timezone

**Risk Level**: MEDIUM - No database schema changes required, but datetime handling is pervasive.

---

## 1. Current State Analysis

### 1.1 Database Schema (Prisma)

```prisma
model ScheduleSlot {
  id          String      @id @default(uuid())
  showId      String
  startTime   DateTime    # ⚠️ Stored as ISO-8601 string in SQLite
  endTime     DateTime    # ⚠️ Stored as ISO-8601 string in SQLite
  sourceUrl   String?
  isRecurring Boolean     @default(false)
  recordings  Recording[]
  show        Show        @relation(...)
}

model Recording {
  id             String        @id @default(uuid())
  scheduleSlotId String?
  filePath       String
  startTime      DateTime      # ⚠️ When recording started
  endTime        DateTime?     # ⚠️ When recording ended
  status         String
  ...
}
```

**Key Insight**: SQLite stores `DateTime` as ISO-8601 text strings (e.g., `"2025-11-22T18:00:00.000Z"`). These are **timezone-agnostic UTC instants**. The timezone interpretation happens in application code.

**Safety**: We do NOT need to change the schema or migrate data. Existing timestamps remain valid UTC instants.

---

### 1.2 Station Timezone Configuration

**Location**: `station-settings.json` (server-side, single file)

```json
{
  "timezone": "America/New_York"
}
```

**Access**:
- `getStationSettings()` - reads timezone from file, defaults to server timezone or UTC
- `updateStationTimezoneAction(formData)` - writes timezone to file

**Status**: ✅ Working, non-destructive, persisted on server

---

### 1.3 Critical Date/Time Usage Points

#### A. Schedule Creation (`app/actions.ts`)

```typescript
// ⚠️ PROBLEM: Uses server's local timezone
const startDateTime = new Date(`${startDateStr}T${startTimeStr}`);
const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

// For recurring shows
for (let i = 0; i < 12; i++) {
    const slotStart = new Date(startDateTime);
    slotStart.setDate(slotStart.getDate() + (i * 7));
    // ...
}
```

**Issue**: `new Date("YYYY-MM-DDTHH:mm")` interprets the string in the **server's local timezone**. If server is in NY and you type "15:00", it creates a NY 3pm instant. But if server moves to UTC, same input would mean UTC 3pm.

---

#### B. Schedule Display (`components/Scheduler.tsx`)

```typescript
// ⚠️ PROBLEM: Converts DB timestamps to browser timezone
const [events, setEvents] = useState(
    initialSlots.map((slot) => ({
        id: slot.id,
        title: slot.show.title,
        start: new Date(slot.startTime),  // Browser interprets in local TZ
        end: new Date(slot.endTime),
        // ...
    }))
);
```

**Issue**: `new Date(slot.startTime)` creates a Date object. When `react-big-calendar` renders it, the `dateFnsLocalizer` formats it using the **browser's timezone**. A viewer in LA sees LA times, not station times.

---

#### C. Recorder Service (`recorder-service.ts`)

```typescript
async function checkSchedule() {
    const now = new Date();  // ⚠️ Server's local time
    
    const activeSlots = await prisma.scheduleSlot.findMany({
        where: {
            startTime: { lte: now },
            endTime: { gt: now },
        },
        // ...
    });
}
```

**Issue**: Compares `now` (server time) with DB timestamps. Works if server timezone = station timezone, but breaks if they diverge.

---

#### D. Date/Time Pickers (`components/NewShowForm.tsx`, `EditSlotModal.tsx`)

Uses `react-datepicker` which:
- Displays dates in the **browser's timezone**
- Returns Date objects interpreted in the **browser's timezone**

**Issue**: If a DJ in LA schedules a 3pm show, the picker sends "3pm LA time" to the server, which might interpret it as "3pm server time" (if server is in NY, that's a 6-hour mismatch).

---

### 1.4 What Currently Works (By Accident)

If:
- Server machine timezone = Station timezone
- All users' browser timezone ≈ Station timezone

Then everything "just works" because the implicit timezone is consistent across server, DB writes, and client display.

**This breaks** when:
- Remote staff in different timezones use the app
- Server is deployed to a cloud VM with UTC timezone
- Station changes physical location

---

## 2. Implementation Strategy

### 2.1 Guiding Principles

1. **Database stores UTC instants** (already true with SQLite DateTime)
2. **Station timezone is the single source of truth** for all business logic
3. **All user input/display goes through station timezone conversion**
4. **Server-side operations normalize to station time before DB writes**
5. **Client-side display converts DB instants → station time for rendering**

### 2.2 No Schema Changes Required

✅ Existing `startTime`/`endTime` columns remain unchanged
✅ No Prisma migration needed
✅ All existing data remains valid

We only change **how we interpret** those timestamps in application code.

---

## 3. Detailed Implementation Plan

### Phase 1: Add Timezone Utility Library (No Risk)

**Goal**: Create a single module that handles all station-timezone conversions.

**File**: `lib/station-time.ts`

```typescript
import fs from 'fs';
import path from 'path';

// Lazy-load heavy date libraries only when needed
let dateFnsTz: any = null;

async function getDateFnsTz() {
  if (!dateFnsTz) {
    dateFnsTz = await import('date-fns-tz');
  }
  return dateFnsTz;
}

export function getStationTimezone(): string {
  try {
    const settingsPath = path.join(process.cwd(), 'station-settings.json');
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.timezone) return parsed.timezone;
    }
  } catch (e) {
    console.error('Failed to read station timezone:', e);
  }
  return 'UTC'; // Safe fallback
}

/**
 * Convert a local date/time string in station timezone to a UTC Date object.
 * Used when creating schedule slots from user input.
 */
export async function stationTimeToUTC(
  dateString: string,
  timeString: string
): Promise<Date> {
  const tz = await getDateFnsTz();
  const stationTz = getStationTimezone();
  
  // Parse "YYYY-MM-DD" and "HH:mm" as station-local time
  const localDateTime = `${dateString}T${timeString}:00`;
  return tz.zonedTimeToUtc(localDateTime, stationTz);
}

/**
 * Convert a UTC Date object to station-local time for display.
 */
export async function utcToStationTime(date: Date): Promise<Date> {
  const tz = await getDateFnsTz();
  const stationTz = getStationTimezone();
  return tz.utcToZonedTime(date, stationTz);
}

/**
 * Format a Date object as station-local time string.
 */
export async function formatStationTime(
  date: Date,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): Promise<string> {
  const tz = await getDateFnsTz();
  const stationTz = getStationTimezone();
  return tz.format(date, formatStr, { timeZone: stationTz });
}

/**
 * Get current time in station timezone.
 */
export async function nowInStationTime(): Promise<Date> {
  const tz = await getDateFnsTz();
  const stationTz = getStationTimezone();
  return tz.utcToZonedTime(new Date(), stationTz);
}
```

**Dependencies**: Add `date-fns-tz` to `package.json`:

```bash
npm install date-fns-tz
```

**Risk**: NONE - This is a new module with no side effects.

---

### Phase 2: Fix Schedule Creation (Server Actions)

**Goal**: When users create shows, interpret their date/time input as station time.

**File**: `app/actions.ts`

**Changes**:

```typescript
import { stationTimeToUTC } from "@/lib/station-time";

export async function createShow(formData: FormData) {
    // ... existing code to extract formData ...
    
    const startDateStr = formData.get("startDate") as string;
    const startTimeStr = formData.get("startTime") as string;
    const durationMins = parseInt(formData.get("duration") as string);
    
    // ✅ NEW: Interpret input as station time, convert to UTC for DB
    const startDateTime = await stationTimeToUTC(startDateStr, startTimeStr);
    const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);
    
    // ... rest remains the same ...
}

export async function createScheduleSlot(
    showId: string,
    startTime: Date,  // Already a Date from modal
    endTime: Date,
    sourceUrl?: string,
    isRecurring: boolean = false
) {
    // ✅ These Date objects should already be in UTC from the modal conversion
    // No change needed here if modal is fixed
}
```

**Testing**:
1. Create a test show with startDate = "2025-11-23", startTime = "15:00"
2. Verify DB stores correct UTC instant
3. Check that recorder fires at correct station-local time

**Risk**: LOW - Additive change, old shows remain unchanged.

---

### Phase 3: Fix Schedule Display (Client Component)

**Goal**: Calendar shows all times in station timezone, regardless of viewer location.

**File**: `components/Scheduler.tsx`

**Changes**:

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { enUS } from 'date-fns/locale'
// ... other imports ...

interface SchedulerProps {
    shows: Show[]
    initialSlots: Slot[]
    streams: { id: string; name: string; url: string }[]
    stationTimezone: string  // ✅ NEW: Pass from parent
}

export default function Scheduler({ 
    shows, 
    initialSlots, 
    streams,
    stationTimezone 
}: SchedulerProps) {
    
    // ✅ Convert DB timestamps (UTC) to station time for display
    const [events, setEvents] = useState(
        initialSlots.map((slot) => ({
            id: slot.id,
            title: slot.show.title,
            // Convert UTC instant → station-local time
            start: utcToZonedTime(new Date(slot.startTime), stationTimezone),
            end: utcToZonedTime(new Date(slot.endTime), stationTimezone),
            resourceId: slot.showId,
            isRecurring: slot.isRecurring,
            type: slot.show.type,
        }))
    );
    
    // ✅ Calendar navigation now stays in station time
    const [date, setDate] = useState(() => 
        utcToZonedTime(new Date(), stationTimezone)
    );
    
    // ... rest of component ...
}
```

**Parent Component** (`app/schedule/page.tsx`):

```typescript
export default async function SchedulePage() {
    const shows = await getShows();
    const slots = await getScheduleSlots();
    const streams = await getStreams();
    const settings = await getStationSettings();
    const timezone = settings.timezone || "UTC";

    return (
        <div className="h-full flex flex-col">
            {/* ... header with clock ... */}
            <div className="flex-1">
                <Scheduler 
                    shows={shows} 
                    initialSlots={slots} 
                    streams={streams} 
                    stationTimezone={timezone}  {/* ✅ NEW */}
                />
            </div>
        </div>
    );
}
```

**Testing**:
1. Set station timezone to `America/New_York`
2. View schedule from browser in `America/Los_Angeles`
3. Verify times display as NY times, not LA times

**Risk**: MEDIUM - Changes how calendar interprets times. Thorough testing required.

---

### Phase 4: Fix Date/Time Pickers (Modals)

**Goal**: When user picks a date/time in a modal, interpret as station time.

**File**: `components/ScheduleModal.tsx`, `EditSlotModal.tsx`

**Changes**:

```typescript
'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'
// ... other imports ...

interface ScheduleModalProps {
    // ... existing props ...
    stationTimezone: string  // ✅ NEW
}

export default function ScheduleModal({ 
    // ... existing props ...
    stationTimezone 
}: ScheduleModalProps) {
    
    const [selectedDate, setSelectedDate] = useState<Date>(() => 
        utcToZonedTime(new Date(), stationTimezone)
    );
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // ✅ Convert station-local time → UTC before sending to server
        const startUTC = zonedTimeToUtc(selectedDate, stationTimezone);
        const endUTC = new Date(startUTC.getTime() + duration * 60 * 60000);
        
        // Call server action with UTC times
        await createScheduleSlot(selectedShow, startUTC, endUTC, '', isRecurring);
        
        // ...
    };
    
    return (
        <div>
            {/* ... modal UI ... */}
            <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date!)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                // ✅ Display in station timezone
            />
            <p className="text-xs text-gray-400 mt-1">
                Times are in {stationTimezone.replace(/_/g, ' ')}
            </p>
        </div>
    );
}
```

**Testing**:
1. Open schedule modal
2. Pick a time (e.g., 3:00 PM)
3. Verify created slot appears at correct station time in calendar
4. Check DB stores correct UTC instant

**Risk**: MEDIUM - User input path, needs careful testing.

---

### Phase 5: Fix Recorder Service

**Goal**: Recorder checks schedule in station time, not server time.

**File**: `recorder-service.ts`

**Changes**:

```typescript
import { PrismaClient } from '@prisma/client'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

const prisma = new PrismaClient()

function getStationTimezone(): string {
    try {
        const settingsPath = path.join(process.cwd(), 'station-settings.json');
        if (fs.existsSync(settingsPath)) {
            const raw = fs.readFileSync(settingsPath, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed?.timezone) return parsed.timezone;
        }
    } catch (e) {}
    return 'UTC';
}

async function checkSchedule() {
    const stationTz = getStationTimezone();
    
    // ✅ Get current time in station timezone
    const nowUTC = new Date();
    const nowStation = utcToZonedTime(nowUTC, stationTz);
    
    console.log(`[${nowUTC.toISOString()}] Checking schedule (Station: ${nowStation})`);

    try {
        // DB query still uses UTC instants
        const activeSlots = await prisma.scheduleSlot.findMany({
            where: {
                startTime: { lte: nowUTC },
                endTime: { gt: nowUTC },
            },
            include: {
                show: true,
            },
        });

        for (const slot of activeSlots) {
            // ✅ Convert slot times to station time for logging
            const slotStartStation = utcToZonedTime(slot.startTime, stationTz);
            const slotEndStation = utcToZonedTime(slot.endTime, stationTz);
            
            console.log(`Active slot: ${slot.show.title} (${slotStartStation} - ${slotEndStation} ${stationTz})`);
            
            // ... rest of recording logic ...
        }
        
        // Stop finished recordings
        for (const [slotId, command] of activeRecordings.entries()) {
            if (!command) continue;
            
            const slot = await prisma.scheduleSlot.findUnique({ where: { id: slotId } })
            if (!slot || slot.endTime <= nowUTC) {  // Still compare UTC
                console.log(`Stopping recording for slot: ${slotId}`)
                command.kill('SIGKILL')
                activeRecordings.delete(slotId)
            }
        }
        
    } catch (error) {
        console.error('Error checking schedule:', error)
    }
}

// ... rest remains the same ...
```

**Testing**:
1. Schedule a show 5 minutes from now in station time
2. Watch recorder service logs
3. Verify recording starts at correct station-local time
4. Verify recording stops at correct end time

**Risk**: LOW - Mostly adds logging, comparison logic unchanged.

---

### Phase 6: Update UI to Show Timezone Context

**Goal**: Make it crystal clear to users what timezone they're working in.

**Files**: Various UI components

**Changes**:

1. **Schedule page header**: Already shows clock with timezone ✅

2. **Modals**: Add timezone indicator near date/time pickers
   ```tsx
   <p className="text-xs text-gray-400">
     All times are in {stationTimezone.replace(/_/g, ' ')} (station time)
   </p>
   ```

3. **Show list**: Display showtimes with timezone suffix
   ```tsx
   {format(slot.startTime, 'h:mm a')} {stationTimezone}
   ```

**Risk**: NONE - Purely informational UI updates.

---

## 4. Testing Strategy

### 4.1 Pre-Implementation Checklist

- [ ] Backup database: `npm run db:backup`
- [ ] Document current show/slot data
- [ ] Take screenshots of existing schedule
- [ ] Install `date-fns-tz`: `npm install date-fns-tz`

### 4.2 Phase-by-Phase Testing

#### Phase 1: Utility Library
- [ ] Create `lib/station-time.ts`
- [ ] Write test script to verify conversions
- [ ] No user-visible changes yet

#### Phase 2: Schedule Creation
- [ ] Create test show with known time
- [ ] Inspect DB with `npm run db:studio`
- [ ] Verify UTC timestamp is correct
- [ ] Compare with old show times

#### Phase 3: Schedule Display
- [ ] View calendar with station timezone = `America/New_York`
- [ ] Change browser timezone to `America/Los_Angeles`
- [ ] Verify calendar still shows NY times
- [ ] Verify navigation works correctly

#### Phase 4: Date Pickers
- [ ] Open schedule modal
- [ ] Pick a time
- [ ] Verify created slot appears at correct time
- [ ] Test from different browser timezones

#### Phase 5: Recorder Service
- [ ] Schedule test show
- [ ] Monitor recorder logs
- [ ] Verify recording starts/stops at station time
- [ ] Check recording files created correctly

#### Phase 6: UI Polish
- [ ] Verify timezone labels appear
- [ ] Check clock shows correct station time
- [ ] Verify settings page works

### 4.3 Rollback Plan

If issues arise:

1. **Revert code changes**: `git reset --hard <commit-before-changes>`
2. **Database is safe**: No schema changes were made
3. **Existing data unchanged**: Only interpretation layer changed
4. **Settings file**: Delete `station-settings.json` to reset timezone

---

## 5. Migration Notes

### 5.1 Existing Shows/Slots

**No migration needed**. Existing timestamps in DB are valid UTC instants and will be correctly interpreted by new code.

**Example**:
- Existing slot: `startTime = "2025-11-22T20:00:00.000Z"`
- Old code: Interprets as server-local 8pm or browser-local 8pm
- New code: Interprets as station-local time (e.g., 3pm NY if timezone = `America/New_York`)

If old slots look "wrong" after update, it means they were created with incorrect timezone assumptions. Can be fixed by:
1. Adjusting station timezone setting
2. Or manually editing specific slots via `npm run db:studio`

### 5.2 Prisma Schema (Future Consideration)

If you ever want to store timezone in DB instead of JSON file:

```prisma
model StationSettings {
  id        String   @id @default("station")
  timezone  String   @default("UTC")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

But **DO NOT DO THIS NOW**. Current JSON approach works and requires no migration.

---

## 6. Known Limitations & Future Work

### 6.1 Current Limitations

1. **RSS Feeds**: Podcast feeds currently use server's date formatting. Should use station timezone.
2. **Email notifications** (if added): Would need station timezone for timestamps.
3. **Recurring shows**: If station crosses DST boundary, recurring slots might shift. date-fns-tz handles this correctly.

### 6.2 Future Enhancements

1. **Multi-station support**: If app ever supports multiple stations, each station would have its own timezone.
2. **User timezone preference**: Show users *both* station time and their local time ("3pm NY / 12pm LA").
3. **Timezone change migration**: Tool to adjust existing slots when station changes timezone.

---

## 7. Implementation Order & Risk Assessment

### Recommended Sequence

1. ✅ **Phase 1** (Utility Library) - DONE FIRST, zero risk
2. **Phase 2** (Schedule Creation) - Test thoroughly with new shows
3. **Phase 3** (Schedule Display) - High user visibility, test extensively
4. **Phase 4** (Date Pickers) - Critical path, thorough testing
5. **Phase 5** (Recorder Service) - Test with upcoming shows
6. **Phase 6** (UI Polish) - Low risk, improves UX

### Risk Matrix

| Phase | Risk Level | Impact | Rollback Difficulty |
|-------|-----------|---------|-------------------|
| 1 | NONE | None | N/A |
| 2 | LOW | New shows only | Easy (code revert) |
| 3 | MEDIUM | All users | Easy (code revert) |
| 4 | MEDIUM | Scheduling | Easy (code revert) |
| 5 | LOW | Recording | Easy (code revert) |
| 6 | NONE | Visual only | Easy (code revert) |

**Database Risk**: NONE - No schema changes, no data migrations.

---

## 8. Success Criteria

The implementation is successful when:

1. ✅ Station admin sets timezone in Settings
2. ✅ All users see schedule in station time, regardless of their location
3. ✅ User creates show at "3pm station time", it appears at 3pm for everyone
4. ✅ Recordings fire at correct station-local times
5. ✅ Calendar navigation works correctly in station timezone
6. ✅ Existing shows/recordings remain intact
7. ✅ No database corruption or data loss

---

## 9. Final Checklist Before Starting

- [ ] Read this entire document
- [ ] Backup database: `npm run db:backup`
- [ ] Install dependencies: `npm install date-fns-tz`
- [ ] Create feature branch: `git checkout -b feat/station-timezone`
- [ ] Commit existing state: `git add -A && git commit -m "Before timezone work"`
- [ ] Begin with Phase 1 (utility library)

---

## 10. Questions & Answers

**Q: Will this break existing shows?**
A: No. Existing timestamps remain valid. They may *appear* at different times after update if they were created with wrong timezone assumptions, but data is not corrupted.

**Q: Do I need to run Prisma migrations?**
A: No. Zero database changes required.

**Q: What if the station changes timezone?**
A: Update in Settings UI. Existing slots remain at their original UTC instants (which is correct). Future slots use new timezone.

**Q: Can users in LA still use the app?**
A: Yes. They'll see/work in station time (e.g., NY time), not their local LA time. This is by design.

**Q: What about DST transitions?**
A: `date-fns-tz` handles DST correctly. A show scheduled at "3pm NY time" will fire at correct wall-clock 3pm even across DST changes.

---

## Appendix: Code Patterns

### Pattern 1: Server Action Receiving Date/Time Input

```typescript
export async function createScheduleSlot(formData: FormData) {
    const dateStr = formData.get("date") as string;
    const timeStr = formData.get("time") as string;
    
    // ✅ Convert station-local input → UTC for DB
    const startUTC = await stationTimeToUTC(dateStr, timeStr);
    
    await prisma.scheduleSlot.create({
        data: {
            startTime: startUTC,  // Store UTC instant
            // ...
        }
    });
}
```

### Pattern 2: Server Component Fetching for Display

```typescript
export default async function SchedulePage() {
    const slots = await getScheduleSlots();
    const settings = await getStationSettings();
    
    // Pass raw UTC timestamps + timezone to client
    return <Scheduler 
        slots={slots} 
        stationTimezone={settings.timezone} 
    />;
}
```

### Pattern 3: Client Component Displaying Times

```typescript
'use client'

export default function Scheduler({ slots, stationTimezone }) {
    const events = slots.map(slot => ({
        // ✅ Convert UTC → station-local for display
        start: utcToZonedTime(new Date(slot.startTime), stationTimezone),
        end: utcToZonedTime(new Date(slot.endTime), stationTimezone),
    }));
    
    return <Calendar events={events} />;
}
```

### Pattern 4: Recorder Service Checking Time

```typescript
async function checkSchedule() {
    const nowUTC = new Date();  // System time
    
    // Query DB with UTC
    const slots = await prisma.scheduleSlot.findMany({
        where: {
            startTime: { lte: nowUTC },
            endTime: { gt: nowUTC },
        }
    });
    
    // Log/display in station time
    const stationTz = getStationTimezone();
    const nowStation = utcToZonedTime(nowUTC, stationTz);
    console.log(`Now: ${nowStation} ${stationTz}`);
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-22  
**Status**: Ready for Implementation

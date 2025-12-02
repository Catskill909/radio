# Schedule Bug Deep Audit: Import/Export & Recurring Shows

## 🔴 Problem Summary

When using import/export functionality, users encounter an error when trying to create new shows with "Repeat Weekly" enabled:

```
Unable to Schedule Show
An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.
```

**Locally**, the error message is more detailed and reveals:
> "Cannot create recurring show: [Future slots] overlap with existing show"

## 🔍 Root Cause Analysis

### The Core Issue: Export & Import Creates Permanent Future Slots

The import/export system has a critical flaw that creates "zombie" future schedule slots:

1. **Export Process** ([`app/api/export/route.ts`](file:///Users/paulhenshaw/Desktop/radio-suite/app/api/export/route.ts#L12-L16))
   - Exports ALL shows with ALL their slots
   - Includes ALL 52 weeks of future recurring slots (created when "Repeat Weekly" was checked)
   - These slots have specific future dates (e.g., slots for December 2025, January 2026, etc.)

2. **Import Process** ([`app/actions/import-data.ts`](file:///Users/paulhenshaw/Desktop/radio-suite/app/actions/import-data.ts#L74-L102))
   - **DOES clear all existing data** ✅ (lines 74-75: `deleteMany` for slots and shows)
   - **BUT** re-imports ALL slots from the export file AS-IS
   - This includes all 52 weeks of pre-generated future slots with their original dates

3. **The Collision** ([`app/actions.ts`](file:///Users/paulhenshaw/Desktop/radio-suite/app/actions.ts#L197-L244))
   - When user tries to create a NEW show with "Repeat Weekly" checkbox
   - `createScheduleSlot` function generates 52 future weekly slots (lines 310-475)
   - `checkSlotOverlap` function (lines 197-244) checks for conflicts
   - **Critical**: Overlap check looks 7 days into the past AND all future slots (line 205)
   - Finds conflicts with the imported future slots from the previous schedule
   - Throws error: "Cannot create recurring show: Week X overlaps with [show]"

### Why "Repeat Weekly" Specifically Fails

- **Non-recurring shows (single slot)**: Only check 1 time slot, less likely to conflict
- **Recurring shows**: Generate 52 future slots, VERY likely to conflict with ANY imported future slots
- The error message correctly identifies which future week has the conflict

## 📊 Data Flow Diagram

```
EXPORT:
Shows DB → Include All Slots (52 weeks) → data.json → ZIP file

IMPORT:
ZIP file → Parse data.json → DELETE all shows/slots → CREATE shows → CREATE all 52 weeks of slots

NEW SHOW WITH RECURRING:
User clicks "Repeat Weekly" → Generate 52 new slots → Check overlap → 
CONFLICT with imported future slots → ERROR ❌
```

## 🐛 Why This Creates "Duplicate" Schedules

The user mentions seeing "2 sets of schedules." Here's what's happening:

1. **First set**: Currently visible shows (this week, maybe next few weeks)
2. **Second set**: Hidden future slots (weeks 10-52) that were imported
3. These future slots are **invisible** in the current calendar view
4. But they **block** new recurring shows from being created
5. Creates the appearance of random, intermittent failures

## 🔧 Technical Details

### Overlap Detection Logic

From [`app/actions.ts:197-244`](file:///Users/paulhenshaw/Desktop/radio-suite/app/actions.ts#L197-L244):

```typescript
async function checkSlotOverlap(startTime: Date, endTime: Date, excludeId?: string) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days in the past
    
    return await prisma.scheduleSlot.findFirst({
        where: {
            AND: [
                {
                    OR: [
                        { startTime: { gte: cutoffDate } },  // Recent
                        { endTime: { gte: cutoffDate } }     // or Future
                    ]
                },
                // ... standard overlap detection
            ]
        }
    });
}
```

**Key Insight**: This check includes ALL future slots without any upper limit. Imported slots from 6 months in the future will block new recurring shows.

### Import Logic

From [`app/actions/import-data.ts:69-107`](file:///Users/paulhenshaw/Desktop/radio-suite/app/actions/import-data.ts#L69-L107):

**What it does correctly:**
- ✅ Wraps in transaction
- ✅ Deletes all existing slots (line 74)
- ✅ Deletes all existing shows (line 75)
- ✅ Re-creates shows from import
- ✅ Re-creates slots with proper date conversion

**What causes the bug:**
- ❌ Re-imports ALL 52 weeks of future slots with their ORIGINAL dates
- ❌ No date adjustment to current time
- ❌ No option to import shows WITHOUT future slots
- ❌ No cleanup of past/distant future slots after import

## 💡 Solutions

### Option 1: Import Only Shows, Not Future Slots (Recommended)

**Concept**: Import show metadata only, let users re-schedule them

**Changes needed:**
- Modify export to separate "show data" from "schedule slots"
- Import creates shows but NOT their slots
- Or only import the FIRST instance of recurring shows
- Users re-create schedule as needed

**Pros:**
- Clean slate for scheduling
- No phantom conflicts
- Users verify schedule manually

**Cons:**
- Loses scheduling information
- More manual work post-import

### Option 2: Smart Slot Date Adjustment

**Concept**: On import, adjust all slot dates relative to "now"

**Example:**
- Export was created 2024-12-01
- Import happens 2024-12-15 (14 days later)
- Shift ALL slot dates forward by 14 days
- Or reset all slots to start "this week"

**Pros:**
- Preserves schedule structure
- Automatic migration

**Cons:**
- Complex date math
- May misalign with intended schedule
- Doesn't account for user intent changes

### Option 3: Import Only Recent/Current Slots

**Concept**: Filter imported slots to only next 2-4 weeks

**Changes:**
```typescript
// In import-data.ts, filter slots before creating
if (slots && slots.length > 0) {
    const fourWeeksOut = new Date();
    fourWeeksOut.setDate(fourWeeksOut.getDate() + 28);
    
    const relevantSlots = slots.filter(slot => 
        new Date(slot.startTime) <= fourWeeksOut
    );
    
    if (relevantSlots.length > 0) {
        await tx.scheduleSlot.createMany({
            data: relevantSlots.map(slot => ({ ... }))
        });
    }
}
```

**Pros:**
- Preserves near-term schedule
- Eliminates distant conflicts
- Simple to implement

**Cons:**
- Loses long-term schedule data
- Arbitrary cutoff date

### Option 4: Clean Up Old Slots After Import

**Concept**: After import completes, delete all slots older than 1 week

**Changes:**
```typescript
// At end of transaction in import-data.ts
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
await tx.scheduleSlot.deleteMany({
    where: {
        endTime: { lt: oneWeekAgo }
    }
});
```

**Pros:**
- Cleans up past data
- Keeps import logic simple

**Cons:**
- **Does not solve the future slot conflict problem**
- Only removes past slots

## 🎯 Recommended Immediate Fix

**Combination of Options 3 + 4:**

1. **On Export**: Export everything (no change needed)
2. **On Import**: 
   - Delete all existing shows/slots ✅ (already done)
   - Import all shows ✅ (already done)
   - **FILTER slots to only import next 4 weeks**
   - Delete any slots older than 1 week
3. **Result**: Clean, conflict-free environment for scheduling

### Implementation Plan

**File**: `app/actions/import-data.ts`

**Changes needed** (lines 93-102):

```typescript
// Create Slots (FILTERED)
if (slots && slots.length > 0) {
    const now = new Date();
    const fourWeeksOut = new Date();
    fourWeeksOut.setDate(fourWeeksOut.getDate() + 28);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Only import slots within the next 4 weeks
    const relevantSlots = slots.filter((slot: any) => {
        const slotStart = new Date(slot.startTime);
        return slotStart >= oneWeekAgo && slotStart <= fourWeeksOut;
    });
    
    if (relevantSlots.length > 0) {
        await tx.scheduleSlot.createMany({
            data: relevantSlots.map((slot: any) => ({
                ...slot,
                startTime: new Date(slot.startTime),
                endTime: new Date(slot.endTime),
            })),
        });
    }
}
```

## 🔍 Local vs Production Error Messages

**Local (Development)**:
- Full error stack trace
- Specific conflicting show name
- Week number
- Helpful debugging info

**Production**:
- Generic Next.js error message
- "Server Components render error"
- "Digest property" for debugging
- **NO specific details** (security feature)

**Why?**: Next.js production builds hide error details to prevent leaking sensitive information about database structure, show names, etc.

**Solution**: Check server logs in production for actual error details.

## 📋 Export File Analysis

### data.json Structure

```json
{
  "version": 1,
  "exportedAt": "2024-12-02T...",
  "shows": [
    {
      "id": "...",
      "title": "My Show",
      "slots": [
        { "startTime": "2024-12-02T10:00:00Z", "endTime": "..." },
        { "startTime": "2024-12-09T10:00:00Z", "endTime": "..." },
        // ... 50 more future weeks ...
        { "startTime": "2025-11-24T10:00:00Z", "endTime": "..." }
      ]
    }
  ]
}
```

**Problem**: The export file is CORRECT and not corrupted. The issue is in how we RE-IMPORT all 52 weeks of slots.

## ✅ Verification Plan

After implementing the fix:

1. **Export data** with recurring shows
2. **Verify export** contains 52 weeks of slots (expected)
3. **Import data** on fresh/test instance
4. **Check database**: Should only have ~4 weeks of slots per recurring show
5. **Create NEW recurring show**: Should succeed without conflicts
6. **Verify schedule**: No duplicate/phantom shows

## 🔄 Migration Notes

For users who have already imported data with this bug:

**Option A: Manual cleanup**
```sql
-- Delete slots more than 4 weeks in the future
DELETE FROM ScheduleSlot 
WHERE startTime > datetime('now', '+28 days');
```

**Option B: Re-import with fix**
1. Export current data
2. Apply code fix
3. Re-import (will filter to 4 weeks automatically)

---

## Summary

The bug is NOT caused by corrupted export files. The import function correctly clears data. The issue is that it re-imports ALL 52 weeks of future recurring slots with their original dates, which then block new recurring shows from being created due to overlap detection.

**Recommended fix**: Filter imported slots to only include the next 4 weeks, allowing users to reschedule or extend shows as needed after import.

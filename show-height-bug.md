# Show Height Bug - Deep Audit

## The Problem

Shows in the schedule calendar are rendering **taller than their actual time duration**, causing visual overlap even though there are NO database overlaps.

### Visual Evidence

![Current Bug](/Users/paulhenshaw/.gemini/antigravity/brain/7583436c-4e99-4d21-abf9-cf51b6e693e8/uploaded_image_1763739837210.png)

- 9:30-9:40 AM (10 mins) - renders too tall
- 10:15-10:25 AM (10 mins) - renders too tall
- They visually overlap despite not actually overlapping in time

## Database Verification

Ran `find-overlaps.ts` - **✅ NO overlaps found in database**

This confirms it's a **CSS/rendering issue**, NOT a data issue.

## Failed Attempts

### Attempt 1: Added `overflow: hidden` to event component
**File**: `components/Scheduler.tsx`
**Change**: 
```tsx
<div className="flex items-center gap-1 h-full px-1 overflow-hidden">
```
**Result**: ❌ Did not fix height issue

### Attempt 2: Added CSS max-height rules
**File**: `app/globals.css`
**Change**:
```css
.rbc-event {
  max-height: 100% !important;
  overflow: hidden !important;
}

.rbc-event-content {
  max-height: 100% !important;
  overflow: hidden !important;
}
```
**Result**: ❌ Did not fix height issue

### Attempt 3: Changed calendar granularity
**File**: `components/Scheduler.tsx`
**Change**: `step={60}` → `step={15}`, `timeslots={1}` → `timeslots={4}`
**Result**: ❌ Still not fixing height issue

## DEEP AUDIT NEEDED

### Files to Audit

1. **`components/Scheduler.tsx`** - Calendar configuration
2. **`app/globals.css`** - All `.rbc-*` CSS rules
3. **`node_modules/react-big-calendar/lib/css/react-big-calendar.css`** (check for defaults)
4. **`components/ScheduleEventTooltip.tsx`** - Could be affecting parent height
5. Any other global CSS affecting the calendar

### Specific CSS Properties to Check

For `.rbc-event` and all child elements:
- `height` / `min-height` / `max-height`
- `line-height`
- `padding` / `padding-top` / `padding-bottom`
- `margin`
- `display` / `flex` properties
- Any `!important` rules that might override

### React-Big-Calendar Props to Review

From `components/Scheduler.tsx`:
- `step={15}` ✅ Set
- `timeslots={4}` ✅ Set
- Any other props that affect event sizing?

## Next Steps

1. Extract ALL CSS rules affecting `.rbc-event*` classes ✅
2. Check for minimum heights being enforced ✅
3. Inspect actual computed CSS in browser DevTools ✅
4. Try NUCLEAR option: add inline styles directly to events ✅
5. Consider if `ScheduleEventTooltip` wrapper is the issue ❌ Not the issue

## 🎉 SUCCESSFUL FIX

### Root Cause Found
**File**: `node_modules/react-big-calendar/lib/css/react-big-calendar.css`
**Line 591**: `min-height: 20px;` on `.rbc-event` classes

This 20px minimum height was forcing all events to render at least 20px tall, regardless of their actual duration!

### The Solution

**File**: `app/globals.css`
**Change**: Added NUCLEAR CSS override with maximum specificity:

```css
/* NUCLEAR OVERRIDE for event heights to fix visual overlap bug */
.rbc-event,
.rbc-day-slot .rbc-event,
.rbc-time-slot .rbc-event {
  min-height: 0 !important;
  height: auto !important;
  padding: 2px 4px !important;
  /* ... other properties ... */
}
```

Key properties:
- `min-height: 0 !important` - Overrides react-big-calendar's 20px minimum
- `height: auto !important` - Allows natural height based on time duration
- `line-height: 1.2 !important` - Reduces line height to fit in short events
- `padding: 2px 4px !important` - Minimal padding to maximize space

**File**: `components/Scheduler.tsx`
**Also needed**: `step={15}` and `timeslots={4}` for 15-minute grid granularity

### Result

✅ Events now render at their TRUE time duration height
✅ NO visual overlap
✅ 10-minute shows render correctly as ~10 minutes
✅ Tooltips work instantly on hover

![Final Working State](/Users/paulhenshaw/.gemini/antigravity/brain/7583436c-4e99-4d21-abf9-cf51b6e693e8/final_height_fix_after_refresh_1763739930875.png)

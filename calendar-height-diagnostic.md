# Calendar Event Height Issue - Diagnostic Plan

## Current Situation

**Problem**: When editing a schedule slot's duration, the event updates in the database and the label shows the correct time, but the visual HEIGHT of the event box does not change.

**Example**:
- Event changed from 30 mins to 45 mins  
- Label correctly shows: "12:30 AM - 1:15 AM" (45 mins)
- Visual height: Still looks like 30 mins

## Evidence

![Event showing correct label but wrong height](/Users/paulhenshaw/.gemini/antigravity/brain/7583436c-4e99-4d21-abf9-cf51b6e693e8/uploaded_image_0_1763740985810.png)

![Modal showing 45 minute duration](/Users/paulhenshaw/.gemini/antigravity/brain/7583436c-4e99-4d21-abf9-cf51b6e693e8/uploaded_image_2_1763740985810.png)

## Root Cause Analysis

### What We Know:
1. ✅ Database updates correctly (confirmed via sqlite query)
2. ✅ Event start/end times are correct in data
3. ✅ Calendar granularity set to 15 minutes (`step={15}`, `timeslots={4}`)
4. ❌ Visual rendering height doesn't match data

### Possible Causes:

1. **Browser CSS Cache**
   - Browser might be caching old CSS
   - Hard refresh (Cmd+Shift+R) needed

2. **React-Big-Calendar Not Re-rendering**
   - Calendar component might not detect event changes
   - May need to force re-mount or key change

3. **CSS Overrides Still Not Enough**
   - Our `height: auto !important` might be overridden
   - React-big-calendar might use inline styles (higher specificity)

4. **Event Object Not Updating**
   - The `Scheduler` component's `events` state might not be refreshing
   - `initialSlots` prop might not be updating

## Diagnostic Steps

### Step 1: Check Browser Cache
- Do hard refresh (Cmd+Shift+R)
- Check if heights update after refresh

### Step 2: Inspect Computed Styles
- Use DevTools to check actual computed `height` on event
- Check if inline styles are overriding our CSS

### Step 3: Check React State
- Add console.log to Scheduler to see if events array updates
- Verify `useEffect` with `initialSlots` dependency fires

### Step 4: Check react-big-calendar Event Props
- Verify calendar is receiving updated event objects with correct start/end times
- Check if calendar's internal state is the issue

## Proposed Fixes

### Fix 1: Force Calendar Re-mount
Add a `key` prop to Calendar that changes on data update

### Fix 2: More Aggressive CSS
Try removing `height: auto` and let calendar control height naturally

### Fix 3: Use Inline Styles
Override event styles using `eventPropGetter` callback

### Fix 4: Clear Component State
Add logic to fully reset Scheduler state on updates

## Status

- [x] Reverted router.refresh() back to window.location.reload()
- [ ] Test hard refresh to rule out cache
- [ ] Inspect computed styles in DevTools
- [ ] Try Fix 1, 2, 3, or 4 based on findings

---
title: "Recurring Shows & Schedules"
category: "Scheduling"
order: 1
relatedTopics:
  - "scheduling-basics"
  - "handling-schedule-conflicts"
keywords:
  - "recurring"
  - "weekly"
  - "repeating"
  - "automation"
---

# Recurring Shows & Schedules

Set up shows that repeat automatically - perfect for weekly programs.

## What are Recurring Shows?

Recurring shows are time slots that repeat on a regular schedule:

- **Weekly Programs** - Every Monday at 8 PM
- **Daily Shows** - Weekday mornings at 7 AM
- **Multi-day Patterns** - Mon/Wed/Fri at 6 PM

Instead of manually scheduling each instance, create one recurring slot and the system generates future instances automatically.

## Creating a Recurring Show

### Step 1: Schedule Initial Slot

1. Click a time slot in the calendar
2. Select your show from the dropdown
3. Set start time and duration

### Step 2: Enable Recurring

Toggle **"Repeats Weekly?"** to ON

**What happens:**
- ✅ System generates ~52 weeks of slots
- ✅ Shows every 7 days at the same time
- ✅ Auto-extends in background (no manual upkeep)

### Step 3: Save

Click **"Schedule Show"** to create all instances.

## How Recurring Works

### Auto-Generation

When you enable recurring:

```
Initial: Mon Jan 1, 2024 at 8:00 PM
  ↓
Generates:
- Mon Jan 8, 2024 at 8:00 PM
- Mon Jan 15, 2024 at 8:00 PM
- Mon Jan 22, 2024 at 8:00 PM
- ... (52 weeks total)
```

### Auto-Extension

Radio Suite maintains recurring schedules automatically:

- **Background job** runs nightly
- **Checks** all recurring patterns
- **Extends** if fewer than 4 weeks ahead
- **No action needed** from you!

### Visual Indicators

Calendar shows recurring status:

- **⟲ Icon** - Indicates recurring show
- **Light border** - Links recurring instances
- **Hover tooltip** - Shows recurrence info

## Editing Recurring Shows

When you click a recurring show slot, you get options:

### Edit This Instance Only

**Use for:**
- One-time time changes
- Guest host for one episode
- Special event adjustments

**Effect:**
- ❌ Breaks instance from recurrence
- ✅ Other instances unchanged
- ✅ This slot becomes independent

### Edit All Future Instances

**Use for:**
- Permanent time change
- New host starting now
- Show format change

**Effect:**
- ✅ Updates this + all future slots
- ❌ Past instances unchanged
- ✅ Maintains recurrence pattern

### Edit Recurrence Pattern

**Use for:**
- Changing the schedule completely
- Moving to different day/time

**Effect:**
- Updates the master pattern
- Regenerates future instances

## Deleting Recurring Shows

### Delete This Instance

Removes just this one occurrence:

**Use for:**
- Holiday cancellations
- One-time pre-emptions

### Delete This & All Future

Ends the series from this point:

**Use for:**
- Show ending permanently
- Hiatus starting now

### Delete All Instances

Removes entire recurring series:

**Use for:**
- Show completely cancelled
- Wrong recurrence created

> **⚠️ Warning:** Deleting all instances removes weeks/months of schedule at once!

## Advanced Patterns

### Multiple Airings per Week

To schedule a show multiple times per week:

**Option 1: Multiple Recurring Slots**
1. Create first recurring slot (Mon 8 PM)
2. Create second recurring slot (Wed 8 PM)
3. Create third recurring slot (Fri 8 PM)

Each has its own recurrence pattern.

**Option 2: Daily Recurring**
1. Enable recurring
2. Manually create additional daily slots
3. Each repeats weekly

### Biweekly Shows

For shows every other week:

1. Create first recurring slot (Week 1)
2. Manually delete every other instance
3. Pattern remains for kept instances

> **📖 Note:** True biweekly recurrence is a planned feature!

### Seasonal Shows

For shows that run only certain months:

**Method 1: Scheduled Deletion**
1. Create recurring slot for full year
2. Delete summer/winter instances
3. Remaining slots auto-maintain

**Method 2: Start/End Dates**
1. Create recurring for season start
2. Delete all instances after season end
3. Recreate next season

## Recurrence & Recording

Recurring shows work seamlessly with recording:

**Automatic Behavior:**
- ✅ Each instance records independently
- ✅ Same recording settings for all
- ✅ Episodes auto-publish (if enabled)
- ✅ No limit on recurring recordings

**Example Workflow:**
1. Create recurring show (Mon 8 PM)
2. Enable recording with Icecast source
3. **Every Monday:**
   - Recording starts automatically
   - Captures show audio
   - Publishes as new episode
   - RSS feed updates

## Handling Conflicts

### Conflict Detection

System prevents overlapping shows:

- ❌ Can't schedule over existing slot
- ❌ Recurring pattern can't conflict
- ✅ Error shows which slot conflicts

### Resolving Conflicts

**Option 1: Adjust Time**
Move new show to non-conflicting time

**Option 2: Delete Conflicting Slot**
Remove the blocking instance

**Option 3: Different Day**
Schedule on a different weekday

## Recurrence & Timezone

Recurring shows respect station timezone:

**DST Transitions:**
- **Spring Forward** - Slots adjust automatically
- **Fall Back** - Slots maintain clock time
- **No manual fixes** needed

**Changing Timezone:**
- All recurring slots update display
- Physical broadcast time unchanged
- Pattern remains intact

## Best Practices

### Planning
- Schedule recurring shows first
- Fill gaps with one-time shows
- Review calendar monthly for conflicts

### Maintenance
- Let auto-extension handle future slots
- Delete individual instances for holidays
- Use "Edit All Future" sparingly

### Recording
- Set recording source before recurring
- Test first instance before bulk scheduling
- Monitor recorder service health

### Communication
- Mark hiatus periods clearly
- Delete far-future slots for uncertain shows
- Update show metadata affects all episodes

## Troubleshooting

### "Can't create recurring - conflict found"

**Cause:**
Another show is already scheduled at this time in the future

**Solution:**
1. Check calendar for conflicting slot
2. Delete or move the conflicting show
3. Try recurring creation again

### "Recurring show stopped extending"

**Cause:**
Recurrence pattern was broken or deleted

**Solution:**
1. Check if pattern still exists
2. Verify show is still marked recurring
3. Contact support if auto-extension failed

### "Some instances are missing"

**Cause:**
Manually deleted or conflict prevented creation

**Solution:**
1. Check deleted instances in activity log
2. Manually recreate missing slots
3. Ensure no conflicts blocking future creation

### "Recurrence changed unexpectedly"

**Cause:**
Used "Edit All Future" unintentionally

**Solution:**
1. Delete incorrect instances
2. Recreate with correct pattern
3. Be cautious with bulk edit options

## Related Topics

- **[Scheduling Basics](/help/scheduling-basics)** - Core scheduling concepts
- **[Handling Schedule Conflicts](/help/handling-conflicts)** - Resolve conflicts
- **[Recording Configuration](/help/recording-configuration)** - Auto-record recurring shows

---
title: "Scheduling Basics"
category: "Getting Started"  
order: 3
relatedTopics:
  - "recurring-shows"
  - "handling-conflicts"
keywords:
  - "schedule"
  - "calendar"
  - "time slot"
  - "scheduling"
---

# Scheduling Basics

Learn how to add shows to the calendar and manage your programming schedule.

## Understanding the Calendar

The Schedule page shows your programming in a visual calendar format:

- **Week View** - See 7 days at a glance (default)
- **Day View** - Focus on a single day with more detail
- **15-Minute Grid** - Time slots in 15-minute increments
- **Color-Coded Shows** - Different colors for podcast vs. music shows

## Creating a Schedule Slot

### Quick Scheduling

1. Click any **empty time slot** in the calendar
2. A modal appears with scheduling controls

### Select a Show

Choose from two options:

**Option 1: Use Existing Show**
- Select a show from the dropdown
- All show metadata is pre-filled

**Option 2: Create New Show**
- Click "Create New Show" in the modal
- Fill in show details
- Schedule automatically after creation

### Set the Time

**Start Time**
- Pre-filled with the clicked time slot
- Adjust hours/minutes with the time picker

**Duration**
- Select from common durations (30min, 1hr, 2hr, etc.)
- OR enter a custom duration

**End Time**
- Calculated automatically
- Shows when the program ends

> **📖 Note:** All times use your station's timezone (set in Settings).

### Recurring Shows

Toggle **"Repeats Weekly?"** to create a recurring show:

- Generates slots for **52 weeks** in advance
- Shows every 7 days at the same time
- **Auto-extends** in the background (no manual upkeep!)
- Displays a **recurring indicator** (⟲) on calendar events

### Save the Slot

Click **"Schedule Show"** to save.

The show appears immediately on the calendar!

## Editing a Schedule Slot

Click any **scheduled event** on the calendar to edit:

- Change start time
- Adjust duration
- Toggle recurring on/off
- Edit show metadata
- Delete the slot

## Deleting Schedule Slots

When deleting a scheduled show, you'll see options:

### Single Instance
Delete just this one occurrence. Best for:
- One-time cancellations
- Special event changes

### This & All Future
Delete this slot and all future recurring instances. Best for:
- Ending a show permanently
- Changing to a new time slot

### Time-Slot-Specific Deletion
Delete only slots at this specific day/time. Best for:
- Removing one of multiple daily airings
- Keeping rebroadcasts but removing the original time

> **⚠️ Warning:** Deletion is permanent and cannot be undone!

## Conflict Prevention

The system automatically prevents scheduling conflicts:

- **Overlap Detection** - Can't schedule two shows at the same time
- **Visual Feedback** - Error message shows which show conflicts
- **Safe Scheduling** - Only valid time slots can be saved

## Midnight-Crossing Shows

Shows that span midnight (e.g., 11 PM - 1 AM) are handled automatically:

- System **splits** the show into two linked slots
- First part: 11 PM - 11:59:59 PM (Monday)
- Second part: 12:00 AM - 1:00 AM (Tuesday)
- **Visual indicators** (→ and ←) show the connection
- Deleting one part deletes both

## Tips & Best Practices

### Planning Ahead
- Schedule recurring shows first
- Fill in one-time specials later
- Use Week View for overview planning
- Use Day View for detailed adjustments

### Time Slot Management
- Standard slot lengths (30min, 1hr, 2hr) work best
- Avoid odd durations unless necessary
- Leave buffer time between shows for station IDs

### Recurring Shows
- Perfect for weekly programs
- Auto-extension means set-it-and-forget-it
- Delete specific instances for holidays/specials

## What's Next?

Now that you can schedule shows:

- **[Recording Configuration](/help/recording-configuration)** - Set up automated recording
- **[Recurring Shows](/help/recurring-shows)** - Deep dive into recurring workflows
- **[Station Timezone](/help/station-timezone)** - Understanding timezone behavior

## Troubleshooting

**"Schedule slot conflicts with existing slot"**
- Another show is already scheduled at this time
- Change the start time or delete the conflicting slot

**Recurring show doesn't show all instances**
- The system generates ~52 weeks ahead
- Scroll forward in the calendar to see future slots
- Auto-extension happens in the background

**Can't click empty time slots**
- Make sure you have at least one show created
- Check that you're not clicking on an existing event
- Try the Day View if Week View is too cluttered

---
title: Handling Schedule Conflicts
description: Learn how to identify and resolve scheduling conflicts between shows.
category: scheduling
icon: fa-solid fa-calendar-xmark
related: ["scheduling-basics", "recurring-shows"]
---

# Handling Schedule Conflicts

Managing a busy radio station schedule often involves juggling multiple shows and time slots. Occasional conflicts are inevitable, but Radio Suite provides tools to help you identify and resolve them quickly.

## Identifying Conflicts

Radio Suite automatically checks for conflicts whenever you:
- Create a new show with a schedule
- Add a new time slot to an existing show
- Edit an existing time slot
- Enable recurring schedules

If a conflict is detected, you will see an error message indicating:
1. **The Conflicting Show:** The name of the show that already occupies the time slot.
2. **The Time Range:** The specific start and end times of the existing slot.

> [!IMPORTANT]
> The system will **prevent** you from saving a schedule that overlaps with an existing slot. You must resolve the conflict before you can proceed.

## Common Conflict Scenarios

### 1. Overlapping One-Off Shows
You try to schedule a special event on Friday from 8:00 PM to 10:00 PM, but "Friday Night Rock" is already scheduled from 9:00 PM to 11:00 PM.

**Resolution:**
- **Adjust the New Show:** Change your special event to end at 9:00 PM.
- **Adjust the Existing Show:** Edit "Friday Night Rock" for that specific week to start at 10:00 PM.

### 2. Recurring Show Conflicts
You want to schedule a new weekly show on Mondays at 10:00 AM, but there is already a show scheduled for that time.

**Resolution:**
- **Check the End Date:** Ensure the existing show is still active. If it has ended, you may need to delete old future slots.
- **Find a New Slot:** Use the Schedule view to find an open gap in the programming.

### 3. Midnight Crossings
Shows that cross midnight (e.g., 11:00 PM to 1:00 AM) can sometimes cause confusion. Radio Suite handles these by splitting the slot across two days visually, but treating it as a single logical block.

**Resolution:**
- Ensure you are looking at the correct day when checking for availability. A show starting late Tuesday night will occupy time on Wednesday morning.

## Best Practices for Conflict Resolution

1.  **Use the Calendar View:** Before scheduling a new show, browse the **Schedule** page. The visual calendar makes it easy to spot gaps.
2.  **Communicate with Hosts:** If you need to move a show to accommodate a special event, communicate with the host well in advance.
3.  **Use "This Slot Only" Edits:** For one-time exceptions (like pre-empting a show for a live sports broadcast), edit the specific recurring slot rather than changing the entire series.

## Troubleshooting

If you believe you are seeing a conflict error incorrectly:
1.  **Check Timezones:** Ensure your station timezone is configured correctly in **Settings**.
2.  **Refresh the Page:** Sometimes cached data can show an outdated schedule.
3.  **Check for "Ghost" Slots:** Occasionally, a deleted show might leave a remnant slot. If you suspect this, contact support.

---
title: "Understanding Station Timezone"
category: "Settings & Configuration"
order: 1
relatedTopics:
  - "scheduling-basics"
  - "daylight-saving-time"
keywords:
  - "timezone"
  - "station time"
  - "UTC"
  - "time zones"
---

# Understanding Station Timezone

Radio Suite uses a **single station timezone** for all scheduling and recording. This ensures everyone sees the same broadcast times regardless of their location.

## Key Concept: One Timezone for All

Traditional radio stations broadcast from a single location with a fixed timezone. Radio Suite mimics this:

- **All schedules** display in station timezone
- **All recordings** start/stop in station timezone
- **All users** see the same times (no per-user conversion)

This prevents confusion when team members are in different locations.

## Setting Your Timezone

### Initial Setup

1. Navigate to **Settings** page
2. Find "Station Timezone" dropdown
3. Select your IANA timezone (e.g., `America/New_York`)
4. Click **Save Changes**

### Available Timezones

Radio Suite uses **IANA timezone database** names:

**US Timezones:**
- `America/New_York` - Eastern Time
- `America/Chicago` - Central Time
- `America/Denver` - Mountain Time
- `America/Los_Angeles` - Pacific Time
- `America/Phoenix` - Arizona (no DST)
- `America/Anchorage` - Alaska Time
- `Pacific/Honolulu` - Hawaii Time

**Other Regions:**
- `Europe/London` - British Time
- `Europe/Paris` - Central European Time
- `Asia/Tokyo` - Japan Standard Time
- `Australia/Sydney` - Australian Eastern Time

> **📖 Note:** IANA names handle daylight saving time automatically!

## How It Works

### Schedule Display

When you view the calendar:
1. Database stores all times in **UTC** (internal format)
2. System converts UTC → **Station Timezone** for display
3. You see times as if you're "at the station"

**Example:**
- Station timezone: `America/New_York` (EST/EDT)
- Database stores: `2024-01-15 18:00:00 UTC`
- Calendar shows: `Mon Jan 15, 1:00 PM` (EST)

### Recording Timing

The recorder service:
1. Polls schedule every 30 seconds
2. Compares **current station time** with **show start times**
3. Starts recording when times match

This ensures shows record at the correct local time, regardless of server location.

## Changing Your Timezone

### Impact on Existing Schedule

**What Happens:**
- All existing slots remain at their **same UTC time**
- Display updates to show times in **new timezone**
- Physical broadcast time **does not change**

**Example:**
You have a show scheduled for "3:00 PM EST" (which is 8:00 PM UTC).

If you change timezone to PST:
- The slot now displays as "12:00 PM PST"
- Still broadcasts at 8:00 PM UTC (same moment)
- Just appears different on the calendar

### When to Change

**Safe to change:**
- During initial setup (no schedule yet)
- Between seasons when schedule is cleared

**Requires caution:**
- Mid-season with active schedule
- Shows currently scheduled and recording

> **⚠️ Warning:** Changing timezone mid-season can confuse viewers expecting shows at specific local times!

## Daylight Saving Time (DST)

### Automatic Handling

IANA timezones automatically adjust for DST:

**Spring Forward (March):**
- Clocks move ahead 1 hour
- 2:00 AM becomes 3:00 AM
- Shows scheduled for 2-3 AM are **automatically adjusted**

**Fall Back (November):**
- Clocks move back 1 hour
- 2:00 AM happens twice
- Shows scheduled during this hour **record once at adjusted time**

### DST-Free Zones

Some locations don't observe DST:
- `America/Phoenix` (Arizona)
- `Pacific/Honolulu` (Hawaii)
- Most of `Asia/*` timezones

These maintain constant UTC offset year-round.

## Station Clock Widget

The Settings page displays a **live clock** showing current station time:

```
Station Local Time
10:25:42 AM
Monday, November 26, 2024
```

This helps you verify:
- Timezone is configured correctly
- Current time matches your expectations
- DST is adjusting properly

## Team Members in Different Zones

### Scenario

Your station is in New York (EST), but:
- Producer is in Los Angeles (PST, -3 hours)
- Host is in London (GMT, +5 hours)

### How They See Schedules

**Everyone sees same times in EST:**
- Show scheduled: "5:00 PM EST"
- LA producer sees: "5:00 PM EST" (their local 2:00 PM)
- London host sees: "5:00 PM EST" (their local 10:00 PM)

They must **mentally convert** to their local time. This prevents scheduling conflicts and ensures everyone references the same broadcast time.

## Best Practices

### Setup
- Choose timezone matching your **broadcast location**
- If purely online, use your **primary audience timezone**
- Set during initial configuration, change rarely

### Communication
- Always reference times in station timezone
- When coordinating remotely, specify "5 PM Station Time"
- Include timezone in public schedules ("Mon 8 PM EST")

### Verification
- Check Station Clock widget regularly
- Verify shows record at expected times
- Test during DST transitions

## Technical Details

### UTC Timestamps

Internally, all times are stored as UTC:
```sql
-- Example database record
startTime: "2024-01-15T20:00:00.000Z"  -- UTC
-- Converted to America/New_York → "3:00 PM EST"
```

### Timezone Conversion

The system uses `date-fns-tz` library:
```javascript
import { toZonedTime } from 'date-fns-tz'

const utcTime = new Date('2024-01-15T20:00:00.000Z')
const stationTime = toZonedTime(utcTime, 'America/New_York')
// Result: 2024-01-15 15:00:00 (3 PM EST)
```

This ensures accurate, DST-aware conversions.

## Troubleshooting

### "Shows recording at wrong time"

**Check:**
- Station timezone setting in Settings page
- Server system timezone (should be UTC)
- Recorder service timezone configuration

**Fix:**
- Verify timezone is correct IANA name
- Restart recorder service after timezone changes

### "DST transition caused duplicate/missing show"

This is expected behavior during DST:
- **Spring Forward**: 2-3 AM shows skip forward
- **Fall Back**: 1-2 AM shows may record twice

Schedule shows outside DST transition hours (2-3 AM) to avoid issues.

### "Team can't coordinate because of timezones"

Solutions:
- Always specify "Station Time" when communicating
- Use clock widget to show current station time
- Consider scheduling during overlapping hours for all team members

## Related Topics

- **[Scheduling Basics](/help/scheduling-basics)** - How schedules use timezone
- **[Daylight Saving Time](/help/daylight-saving-time)** - DST-specific behavior
- **[Station Settings](/help/station-settings)** - All configuration options

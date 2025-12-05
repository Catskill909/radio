# Listener Analytics (Future Development)

## Overview

Track and display historical listener data to help station operators understand audience engagement over time.

## Proposed Features

### Real-Time Dashboard
- Current listeners count (✅ already implemented)
- Peak listeners today
- Average session duration

### Historical Stats
- **Today:** Total unique listeners, total listen time
- **This Week:** Daily breakdown chart
- **This Month:** Weekly trends
- **All Time:** Total unique listeners, peak concurrent

### Database Schema

```prisma
model ListenerSession {
  id          String   @id @default(uuid())
  startTime   DateTime @default(now())
  endTime     DateTime?
  duration    Int?     // seconds
  userAgent   String?
  createdAt   DateTime @default(now())
}

model ListenerStats {
  id          String   @id @default(uuid())
  date        DateTime @unique
  uniqueListeners Int
  totalSessions   Int
  totalMinutes    Int
  peakConcurrent  Int
  createdAt   DateTime @default(now())
}
```

### Implementation Steps

1. **Add Prisma models** for listener sessions and daily stats
2. **Track sessions** - Record start time on `subscribe('site-listeners')`, end time on `unsubscribe`
3. **Daily aggregation** - Cron job to calculate daily stats at midnight
4. **Stats API** - New endpoint `/api/stats/listeners` returning historical data
5. **Stats UI** - Add historical section to `/stats` page with charts

### Dependencies

- Chart library for visualization (e.g., `recharts` or `chart.js`)
- Possibly a cron/scheduler for daily aggregation

## Priority

Medium - Nice to have for station operators, not critical for core functionality.

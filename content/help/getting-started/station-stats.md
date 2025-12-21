# Station Stats Dashboard

The Station Stats dashboard provides real-time monitoring of your station's health, activity, and **engagement analytics** for episode plays.

## Overview

Access the Stats page from the sidebar to view:

- **Directory Overview** – Total shows, episodes, and live listeners
- **Engagement Analytics** – Play tracking with time filters and charts
- **WebSocket Status** – Connection to real-time updates
- **Streams** – Online/offline status of your audio streams
- **Recordings** – Recent recording activity and events

---

## Engagement Analytics

Track how your audience interacts with your content on the public listen page.

### Metrics Cards

- **Total Plays** – Number of episode plays in the selected time period
- **Downloads** – Download count (placeholder for future feature)
- **Unique Listeners** – Approximate count of distinct listeners
- **Download Rate** – Percentage of plays that result in downloads

### Time Range Filters

Switch between different time periods:
- **7 Days** – Last week of activity
- **30 Days** – Last month
- **90 Days** – Last quarter
- **All Time** – Complete history

### Show Filter

Use the dropdown to filter all analytics to a specific show, or select "All Shows" for station-wide stats.

### Engagement Trends Chart

A smooth line chart showing daily plays over time:
- **Green line** = Plays
- **Blue line** = Downloads
- **Hover** over any point to see date and exact counts
- **Y-axis** automatically scales based on your data (from 5 to 1000+)

### Top Episodes & Top Shows

Tables showing your most-played content:
- **Top Episodes** – Ranked by play count with show name
- **Top Shows** – Ranked by total plays with episode count

---

## Recording Event Log

The Recording Event Log shows live updates as recordings:
- **Start** – When a scheduled recording begins
- **Complete** – When a recording finishes successfully
- **Fail** – If a recording encounters an error

Events appear in real-time via WebSocket and persist after page reload.

## Stream Status

The Stream Status section shows each configured Icecast stream with:
- Current online/offline status
- Visual indicators (green = online, red = offline)

---

## How Play Tracking Works

Plays are tracked automatically when:
1. A visitor opens a show on the public `/listen` page
2. They click an episode to play it
3. A play event is logged to the database

**Note:** Only plays from the public listen page are tracked. Admin audio players (recordings, episodes, audio editor) are not tracked.

---

## Tips

- Keep the Stats page open to monitor long-running recordings
- The "Live Updates" indicator confirms your WebSocket connection is active
- Use time range filters to compare engagement across different periods
- Check Top Episodes to identify your most popular content
- Click "View All →" to see your complete recordings library

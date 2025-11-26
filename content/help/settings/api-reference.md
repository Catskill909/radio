---
title: API Reference
description: Technical documentation for Radio Suite's public API endpoints.
category: Settings & Configuration
icon: fa-solid fa-code
related: ["rss-feed-management", "user-guide"]
---

# API Reference

Radio Suite provides several public endpoints that you can use to integrate your station's data into external websites or mobile apps.

## Public Data

### Get Now Playing Data
Returns metadata about the currently playing show and the next scheduled show.

**Endpoint:**
`GET /api/public/now-playing`

**Response:**
```json
{
  "current": {
    "title": "Morning Jazz",
    "host": "DJ Blue",
    "description": "Smooth jazz to start your day.",
    "image": "https://...",
    "startTime": "2023-11-26T14:00:00Z",
    "endTime": "2023-11-26T16:00:00Z"
  },
  "next": {
    "title": "News Hour",
    "startTime": "2023-11-26T16:00:00Z"
  }
}
```

### Get Global RSS Feed
Returns the master RSS feed containing all published episodes from all shows.

**Endpoint:**
`GET /api/feed`

**Response:**
Standard XML RSS 2.0 feed.

### Get Show-Specific RSS Feed
Returns the RSS feed for a single specific show.

**Endpoint:**
`GET /api/feed/show/[showId]`

**Response:**
Standard XML RSS 2.0 feed.

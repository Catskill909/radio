---
title: API Reference
description: Technical documentation for Radio Suite's public API endpoints.
category: Settings & Configuration
icon: fa-solid fa-code
related: ["rss-feed-management", "user-guide"]
---

# API Reference

StationDock provides a comprehensive public API for integrating your station's data into external websites, mobile apps, and third-party services. No authentication is required.

---

## Core Endpoints

### Get Now Playing Data
Returns metadata about the currently playing show and the next scheduled show.

**Endpoint:** `GET /api/public/now-playing`

**Response:**
```json
{
  "stationInfo": {
    "name": "Radio International",
    "tagline": "Public Radio for the World",
    "defaultArtwork": "/uploads/logo.png"
  },
  "currentShow": {
    "id": "abc123",
    "title": "Morning Jazz",
    "host": "DJ Blue",
    "artwork": "/uploads/show.png",
    "startTime": "2025-12-06T14:00:00Z",
    "endTime": "2025-12-06T16:00:00Z",
    "timeRemaining": 38
  },
  "nextShow": {
    "id": "def456",
    "title": "News Hour",
    "host": "Reporter Smith",
    "startTime": "2025-12-06T16:00:00Z"
  }
}
```

---

### Get Station Info
Returns station branding and configuration.

**Endpoint:** `GET /api/public/station`

**Response:**
```json
{
  "name": "Radio International",
  "description": "Public Radio for the World",
  "email": "contact@station.com",
  "timezone": "America/New_York",
  "logoUrl": "/uploads/logo.png",
  "streamUrl": "https://stream.station.com/live"
}
```

---

### Get All Shows
Returns all shows with pagination and filtering.

**Endpoint:** `GET /api/public/shows`

**Query Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 20 | Max items (1-100) |
| `offset` | 0 | Skip N items for pagination |
| `sort` | `recent` | Order: `recent`, `oldest`, `alphabetical` |
| `type` | — | Filter by show type (e.g., `Music`, `Syndicated Podcast`) |
| `host` | — | Filter by host name |

**Examples:**
```
GET /api/public/shows?limit=10
GET /api/public/shows?limit=5&sort=alphabetical
GET /api/public/shows?type=Music
```

**Response:**
```json
{
  "data": [
    {
      "id": "abc123",
      "title": "Morning Jazz",
      "host": "DJ Blue",
      "type": "Local Music",
      "description": "Smooth jazz to start your day",
      "image": "/uploads/show.png",
      "tags": ["Jazz", "Morning"],
      "rssFeedUrl": "/api/feed/show/abc123"
    }
  ],
  "pagination": {
    "total": 27,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Get Show Details
Returns detailed information about a specific show.

**Endpoint:** `GET /api/public/shows/[id]`

**Response:** Show metadata, recent episodes, and schedule information.

---

### Get Schedule
Returns schedule slots for a date range.

**Endpoint:** `GET /api/public/schedule`

**Query Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `start` | Today | ISO 8601 start datetime |
| `end` | 7 days ahead | ISO 8601 end datetime |

**Example:**
```
GET /api/public/schedule?start=2025-12-01T00:00:00Z&end=2025-12-07T23:59:59Z
```

**Response:**
```json
{
  "stationTimezone": "America/New_York",
  "slots": [
    {
      "id": "slot123",
      "showId": "abc123",
      "startTime": "2025-12-06T14:00:00Z",
      "endTime": "2025-12-06T16:00:00Z",
      "show": {
        "title": "Morning Jazz",
        "host": "DJ Blue",
        "image": "/uploads/show.png"
      }
    }
  ]
}
```

---

### Get Streams
Returns all enabled audio streams with health status.

**Endpoint:** `GET /api/public/streams`

**Response:**
```json
{
  "activeStreamUrl": "https://stream.station.com/live",
  "streams": [
    {
      "id": "stream123",
      "name": "Main Stream",
      "url": "https://stream.station.com/live",
      "status": "online",
      "format": "MP3",
      "isActive": true
    }
  ]
}
```

---

### Get Recordings
Returns completed recordings with pagination.

**Endpoint:** `GET /api/public/recordings`

**Query Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 20 | Max items (1-100) |
| `offset` | 0 | Skip N items |
| `sort` | `recent` | Order: `recent`, `oldest` |
| `status` | `COMPLETED` | Filter by status |
| `showId` | — | Filter by show ID |

**Example:**
```
GET /api/public/recordings?limit=10
GET /api/public/recordings?showId=abc123
```

**Response:**
```json
{
  "data": [
    {
      "id": "rec123",
      "status": "COMPLETED",
      "startTime": "2025-12-05T14:00:00Z",
      "endTime": "2025-12-05T16:00:00Z",
      "duration": 120,
      "show": {
        "title": "Morning Jazz",
        "host": "DJ Blue"
      },
      "episode": {
        "id": "ep123",
        "title": "Morning Jazz - December 5",
        "publishedAt": "2025-12-05T16:00:00Z"
      }
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Get Podcasts (Shows with Feed URLs)
Returns all shows with their **full absolute RSS feed URLs**, suitable for podcast directory submission or app integration.

**Endpoint:** `GET /api/public/podcasts`

**Query Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 20 | Max items (1-100) |
| `offset` | 0 | Skip N items |

**Response:**
```json
{
  "data": [
    {
      "id": "abc123",
      "title": "Morning Jazz",
      "host": "DJ Blue",
      "description": "Smooth jazz to start your day",
      "image": "/uploads/show.png",
      "category": "Music",
      "episodeCount": 12,
      "rssFeedUrl": "https://yoursite.com/api/feed/show/abc123",
      "latestEpisode": {
        "title": "Episode 12",
        "publishedAt": "2025-12-05T16:00:00Z",
        "duration": 3600
      }
    }
  ],
  "globalFeedUrl": "https://yoursite.com/api/feed",
  "pagination": { "total": 27, "limit": 20, "offset": 0, "hasMore": true }
}
```

> **Note:** The `rssFeedUrl` and `globalFeedUrl` are automatically generated with the correct base URL for your environment (localhost, production, etc.).

---

## RSS Feeds

### Global RSS Feed
Returns an RSS feed of all published episodes from all shows.

**Endpoint:** `GET /api/feed`

**Response:** Standard XML RSS 2.0 feed with iTunes namespace.

---

### Show-Specific RSS Feed
Returns the iTunes-compatible RSS feed for a single show.

**Endpoint:** `GET /api/feed/show/[showId]`

**Response:** Standard XML RSS 2.0 feed suitable for podcast distribution.

---

## Use Cases

**Mobile App Integration**
Use `/api/public/now-playing` for a live player, `/api/public/schedule` for a program guide, and `/api/public/shows` for a show directory.

**Website Widget**
Embed a "Now Playing" widget using `/api/public/now-playing` with 30-second polling.

**External Schedule Display**
Power lobby displays or digital signage with `/api/public/schedule`.

**Podcast Directory Submission**
Submit `/api/feed/show/[showId]` URLs to Apple Podcasts, Spotify, and other directories.

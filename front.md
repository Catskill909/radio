# Public-Facing Radio Station Interface – Planning Document

**Status:** Planning / Ideas Only  
**Last Updated:** 2025-11-23

---

## Overview

This document outlines the vision and requirements for a **public-facing listener interface** for Radio Suite. The goal is to provide listeners with an engaging, informative, and interactive experience that showcases the station's live programming, schedule, show information, and on-demand content.

### Architecture Decision

**Approach:** Single-Page Application (SPA) with modal dialogs  
**Authentication:** None - fully public interface  
**Focus:** Live stream listening, schedule browsing, show/episode discovery  
**Philosophy:** Simple, fast, accessible - with room for growth

---

## Core Requirements (MVP)

### 1. Live Schedule Display

**Description:**  
A visual weekly/daily schedule grid showing what's on-air now and upcoming shows.

**Features:**
- Read-only version of the admin calendar view
- Shows current time indicator (station timezone)
- Color-coded show blocks with show artwork thumbnails
- Hover effects showing basic show info (title, host, time)
- Click to open detailed show modal

**Backend Integration:**
- Use existing `ScheduleSlot` data with `Show` relations
- Leverage timezone utilities already in place
- API endpoint: `GET /api/public/schedule` (to be created)

---

### 2. Show Detail Modal

**Description:**  
When a listener clicks on a schedule block, open a modal displaying full show information and metadata.

**Modal Contents:**
- **Show Artwork** (full size)
- **Show Title** and host name
- **Description** (full text)
- **Show Type** (Local/Syndicated/Music)
- **Tags/Categories**
- **Schedule Times** (e.g., "Airs Mondays at 3:00 PM")
- **Link to RSS Feed** (if podcast episodes are available)
- **Social Links** (future: Apple Podcasts, Spotify, etc. once those URL fields are added)
- **Latest Episodes** (if available) with embedded players

**Backend Integration:**
- Show metadata already exists in database
- Episode data available via existing `Episode` model
- Audio playback via existing `/api/audio/[filename]` endpoint

---

### 3. Station Clock (Live Date/Time)

**Description:**  
Display the current date and time in the station's timezone, matching the admin schedule.

**Features:**
- Real-time updating clock (every second)
- Displays day of week, date, and time
- Uses station timezone setting from Settings
- Visual design should be prominent but not distracting

**Backend Integration:**
- Use existing `stationTimezone` from Settings
- Client-side rendering with `date-fns-tz`

---

### 4. Live Stream Player

**Description:**  
Embedded audio player allowing listeners to tune into the live radio stream.

**Features:**
- **Play/Pause** controls
- **Volume** slider
- **Stream metadata** display (current bitrate, format)
- **Stream health indicator** (online/offline)
- **Sticky player** option (stays visible while scrolling)
- **Auto-reconnect** on stream failure

**Stream Source:**
- Pull from existing `IcecastStream` table
- Default to primary station stream (or allow station to designate a "public stream")
- Use existing health check infrastructure (`/api/streams/health`)

**Technical Considerations:**
- HTML5 `<audio>` element or react-h5-audio-player
- Handle CORS if Icecast server is on different domain
- Consider buffering indicators and error states

---

### 5. "Now Playing" Display

**Description:**  
Show what's currently on-air with live metadata.

**Display Elements:**
- **Show Title** (current scheduled show)
- **Host Name**
- **Show Artwork** (large display)
- **Time Remaining** (e.g., "On until 5:00 PM")
- **Next Show** preview ("Up next: [Show Name] at [Time]")

**Backend Integration:**
- Query current `ScheduleSlot` based on station time
- API endpoint: `GET /api/public/now-playing` (to be created)
- Returns current show, next show, and metadata
- Updates every 30-60 seconds via polling or WebSocket (future)

---

## Feature Audit: Backend Capabilities Available for Public Interface

### ✅ Already Implemented (Can Expose to Public)

| Backend Feature | Public Use Case |
|----------------|-----------------|
| **Show Metadata** | Display show title, description, host, artwork, type, tags |
| **Schedule Slots** | Render weekly/daily schedule grid with accurate times |
| **Station Timezone** | Ensure all times displayed match station time |
| **Icecast Streams** | Provide live stream URL for embedded player |
| **Stream Health Checks** | Show online/offline status of live stream |
| **Published Episodes** | Display episode archive per show |
| **RSS Feeds** | Provide podcast subscription links (per-show feeds) |
| **Audio Playback API** | Stream episode audio files to public (if desired) |
| **Station Identity** | Display station name, logo, description, contact email |

### 🔨 Needs New Public API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/public/schedule` | Return schedule slots for a date range (default: current week) |
| `GET /api/public/now-playing` | Return current show, next show, and metadata |
| `GET /api/public/shows` | List all shows with metadata (for show archive page) |
| `GET /api/public/shows/[id]` | Get detailed show info including episodes |
| `GET /api/public/episodes/recent` | Return recently published episodes across all shows |

### 🚫 Should NOT Be Exposed

- Admin-only features (editing, deleting, recording management)
- Unpublished episodes or recordings
- Stream admin credentials or internal URLs
- Database statistics or health metrics

---

## Inspiration from LibreTime & Similar Platforms

### LibreTime Public Pages Features

1. **"On Air Now" Widget**
   - Current show with artwork and host
   - Progress bar showing time elapsed in current show
   - Next show preview

2. **Weekly Schedule Page**
   - Grid view similar to admin calendar
   - Filtering by show type or genre
   - Export schedule as PDF or iCal

3. **Show Archive**
   - Directory of all shows with search/filter
   - Per-show pages with description, host bio, past episodes

4. **Embeddable Widgets**
   - JavaScript widget for "Now Playing" that external sites can embed
   - Schedule widget for partner websites

5. **Social Media Integration**
   - Share show links to social platforms
   - Tweet current show or episode

### Airtime Pro Public Features

1. **Customizable Landing Page**
   - Station branding (logo, colors, tagline)
   - Hero section with live player and "now playing"

2. **Listener Analytics**
   - Real-time listener count
   - Geographic breakdown of listeners (privacy-aware)

3. **Program Guide**
   - TV-guide style schedule with time blocks
   - Filter by genre, host, or day

### What We Can Adopt

From the above inspiration, prioritize:
- **Now Playing widget** (easy to implement with existing backend)
- **Public show archive** (leverage existing episode/show data)
- **Embeddable schedule widget** (future enhancement)
- **Social sharing buttons** (low-effort, high value)

---

## Additional Enhancement Ideas

### Near-Term (P1)

1. **Responsive Design**
   - Mobile-first approach
   - Touch-friendly schedule grid on mobile
   - Collapsible player on smaller screens

2. **Dark/Light Mode Toggle**
   - Match listener preference
   - Consistent with admin UI dark theme

3. **Search Functionality**
   - Search shows by title, host, or tag
   - Search episodes by title or description

4. **Social Sharing**
   - Share show pages, episodes, or schedule to Twitter, Facebook, etc.
   - Open Graph meta tags for rich social previews

5. **Podcast Subscribe Buttons**
   - One-click subscribe to Apple Podcasts, Spotify, etc. (when aggregator URLs are added)
   - Copy RSS feed URL button

### Medium-Term (P2)

1. **iCal Export**
   - Allow listeners to subscribe to station schedule in their calendar apps
   - Generate `.ics` file from schedule data

2. **Listener Request Form**
   - Submit song requests or show topic suggestions
   - Integrate with admin dashboard for DJs/producers to view

3. **Chat/Comments (Per Show)**
   - Allow listeners to comment on shows or episodes
   - Moderation tools in admin interface

4. **Newsletter Signup**
   - Collect emails for station newsletter
   - Integration with Mailchimp, SendGrid, or similar

5. **Embeddable Widgets**
   - **Now Playing Widget**: `<script>` tag for external websites
   - **Schedule Widget**: Display upcoming shows on partner sites
   - **Player Widget**: Standalone live stream player

6. **Show Archive Page**
   - Browse all shows in a grid or list
   - Filter/sort by type, genre, or host
   - Link to individual show pages

### Longer-Term (P3)

1. **Listener Profiles**
   - Create accounts to favorite shows
   - Subscribe to show-specific notifications
   - Personalized "My Shows" page

2. **Real-Time Listener Count**
   - Display current listener count from Icecast stats
   - Privacy-aware geographic breakdown (country-level only)

3. **Live Chat During Shows**
   - Real-time chat for listeners during live broadcasts
   - Requires WebSocket infrastructure

4. **Mobile App (PWA)**
   - Progressive Web App for install-to-home-screen experience
   - Push notifications for favorite shows starting
   - Offline schedule caching

5. **Multi-Language Support**
   - Internationalization (i18n) for station UI
   - Show descriptions in multiple languages

---

## Design Considerations

### Visual Identity

- **Branding**: Use station logo, colors, and typography from Settings
- **Consistency**: Match admin UI aesthetic (dark theme option)
- **Professional**: Clean, modern design that builds trust
- **Accessible**: WCAG 2.1 AA compliance (color contrast, keyboard nav, screen reader support)

### User Experience (UX)

- **Performance**: Fast load times (<2s initial load)
- **Mobile-First**: 60%+ of listeners likely on mobile
- **Intuitive Navigation**: Clear paths to schedule, shows, and live stream
- **Minimal Clicks**: One click to start listening, two clicks to show details

### Technical Architecture

- **Next.js SSR/SSG**: Server-side render schedule for SEO
- **API Routes**: Public API endpoints separate from admin endpoints
- **Caching**: Cache schedule data (revalidate every 5-10 minutes)
- **CDN-Friendly**: Static assets and pages should be CDN-compatible
- **SEO Optimized**: Meta tags, structured data (Schema.org for events/shows)

---

## URL Structure (Proposed)

```
/                          → Public home page (now playing + schedule preview)
/schedule                  → Full weekly schedule
/shows                     → Show archive (all shows)
/shows/[slug]              → Individual show page
/shows/[slug]/episodes     → Episode archive for a show
/episodes                  → Recent episodes across all shows
/listen                    → Dedicated live stream player page
/about                     → About the station (station identity info)
```

---

## Security & Privacy

1. **Rate Limiting**: Prevent abuse of public API endpoints
2. **No Sensitive Data**: Never expose admin credentials, internal URLs, or unpublished content
3. **CORS Configuration**: Allow cross-origin requests for embeddable widgets
4. **Analytics Privacy**: If adding listener analytics, anonymize IPs and comply with GDPR/CCPA

---

## Open Questions / Discussion Points

1. **Custom Domain Support?**  
   - Should public interface be at `/public` route or separate subdomain (e.g., `listen.station.com`)?
   - Or even on the main domain root (`/`) with admin at `/admin`?

2. **Monetization Hooks?**  
   - Ad slots, sponsor banners, donation buttons for community radio?
   - Patreon/Ko-fi integration for listener support?

3. **Accessibility Target?**  
   - WCAG 2.1 AA or AAA compliance?

4. **Live Metadata from Icecast?**  
   - Can we pull "now playing" song/track info from Icecast metadata (if station uses AutoDJ)?
   - Display current track title, artist, album art from stream metadata?

5. **Modal vs. Full Page for Show Details?**
   - Modals keep user in flow and maintain player state
   - Full pages better for SEO and shareable links
   - Proposal: Use modals by default, but support direct URLs that open modals (e.g., `/shows/morning-show` opens modal on schedule page)

6. **Caching Strategy?**
   - How often to refresh schedule data? (Every 5 min, 15 min?)
   - Cache "now playing" data? (30-60 seconds?)
   - Use SWR (stale-while-revalidate) pattern?

---

## Next Steps (After Review)

1. **User Feedback**: Review this document and add/remove requirements
2. **Prioritization**: Decide MVP scope (what ships in v1?)
3. **Design Mockups**: Create wireframes/mockups for key pages
4. **API Design**: Define exact public API endpoint schemas
5. **Implementation Plan**: Break down into tasks and estimate effort

---

## References

- [LibreTime Public Pages](https://libretime.org/)
- [Airtime Pro Features](https://www.airtime.pro/)
- [Icecast Stream Directory](https://dir.xiph.org/)
- [Schema.org Event Markup](https://schema.org/Event)

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

**Interaction Pattern (Two-Tier):**

**Tier 1 - Hover Tooltip (Quick Info):**
- Shows on hover/tap over schedule block
- Minimal, non-intrusive display
- Contents:
  - Show title
  - Show type badge (Local/Syndicated/Music)
  - Time range (e.g., "7:15 PM - 7:25 PM")
  - Duration (e.g., "10 minutes")
  - Host name
  - **"More Info" button** (opens full modal)

**Tier 2 - Full Show Modal (Detailed Info):**
- Triggered by "More Info" button in tooltip OR direct click on schedule block
- Modal overlay with comprehensive show information
- Contents:
  - Large show artwork
  - Full description
  - Host bio/info
  - All metadata (tags, category, explicit flag)
  - RSS feed link
  - Social/aggregator links (Apple Podcasts, Spotify, etc.)
  - Latest episodes (if available) with players
  - Schedule recurrence info ("Airs weekly on Mondays at 3:00 PM")

**Rationale:**
- Prevents UI clutter for short shows (5-10 minute slots)
- Scalable for stations with hundreds of schedule blocks
- Progressive disclosure - users get quick info first, deep dive on demand
- Maintains player state during modal navigation (SPA benefit)

**Features:**
- Read-only version of the admin calendar view
- Shows current time indicator (station timezone)
- Color-coded show blocks with show artwork thumbnails
- Smooth modal transitions
- Keyboard accessible (Esc to close, Tab navigation)

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

---

## Mobile Layout Exploration

### The Challenge

**Problem:** Dense schedule information (24 hours × 7 days = 168 time slots) in a ~375px wide viewport  
**Goal:** Intuitive navigation, quick scanning, minimal scrolling, clear "what's on now"

---

### Approach 1: Traditional Grid (Compressed)

**Description:** Mini version of desktop calendar grid

**Layout:**
- Horizontal scroll for days (swipe left/right)
- Vertical scroll for hours
- Compressed time blocks (15-min = ~20px height)
- Show titles truncated to 1-2 lines

**Pros:**
- Familiar pattern (Google Calendar, Outlook)
- Shows entire day structure at a glance
- Easy to see show timing/duration

**Cons:**
- ❌ Requires precise tapping on tiny blocks
- ❌ Lots of scrolling (vertical + horizontal)
- ❌ Hard to read truncated show names
- ❌ Not ideal for 5-10 minute shows

**Verdict:** Works for desktop, struggles on mobile

---

### Approach 2: List View (Time-Based)

**Description:** Vertical scrolling list of shows in chronological order

**Layout:**
```
[Now On Air] ━━━━━━━━━━━━━━━━━
┌─────────────────────────────┐
│ 🎵 Morning Show             │
│ 6:00 AM - 9:00 AM          │
│ with DJ Sarah              │
│ [▶ Listen] [More Info]     │
└─────────────────────────────┘

[Up Next]
┌─────────────────────────────┐
│ News Brief                  │
│ 9:00 AM - 9:15 AM (15 min) │
│ Local News                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Coffee Talk                 │
│ 9:15 AM - 10:00 AM         │
│ with Mike & Lisa           │
└─────────────────────────────┘
```

**Pros:**
- ✅ Clean, scannable
- ✅ Large tap targets
- ✅ Shows full titles
- ✅ Works great for "what's coming up"

**Cons:**
- ⚠️ Hard to see overall week structure
- ⚠️ Can't easily jump to specific day/time
- ⚠️ Long list for 24-hour stations

**Enhancements:**
- Sticky "Now Playing" header
- Day selector tabs at top
- "Jump to time" quick nav

**Verdict:** Good for "what's on today," less good for browsing full week

---

### Approach 3: Swipeable Cards (Story-Style)

**Description:** Instagram Stories / Tinder-style card stack

**Layout:**
- Full-screen cards, one show per view
- Swipe up/down to navigate through schedule
- Current show always centered
- Previous/next shows visible at edges

**Interaction:**
- Swipe up: Next show
- Swipe down: Previous show
- Tap card: Expand to full modal
- Tap "Listen Live": Start stream

**Visual:**
```
     ┌───────────┐
     │ Prev Show │ (Peeking from top, 20% visible)
     └───────────┘
┌─────────────────────────────┐
│                             │
│   [Large Show Artwork]      │
│                             │
│   🎵 The Morning Show        │
│   with DJ Sarah             │
│                             │
│   ● ON AIR NOW              │
│   6:00 AM - 9:00 AM         │
│   2h 15m remaining          │
│                             │
│   [━━━━━━━━▱▱▱▱▱▱] 75%     │
│                             │
│   [▶ Listen Live]           │
│   [More Info]               │
│                             │
└─────────────────────────────┘
     ┌───────────┐
     │ Next Show │ (Peeking from bottom, 20% visible)
     └───────────┘
```

**Pros:**
- ✅ Beautiful, immersive
- ✅ Focus on one show at a time
- ✅ Natural mobile gesture (swipe)
- ✅ Great for discovery
- ✅ Large artwork showcase

**Cons:**
- ⚠️ Can't see multiple shows at once
- ⚠️ Harder to navigate to specific time/day
- ⚠️ Unconventional for schedule viewing

**Enhancements:**
- Mini timeline scrubber at bottom
- "Jump to Now" button always visible
- Haptic feedback on hour boundaries

**Verdict:** 🌟 **Innovative, engaging** - could be groundbreaking for radio schedule UX

---

### Approach 4: Timeline Scroll (Horizontal)

**Description:** Horizontal timeline with current time always centered

**Layout:**
- Infinite horizontal scroll
- Time markers every hour
- Show blocks sized by duration
- Auto-centers on "now"

**Visual:**
```
       Past ←  NOW  → Future
    ┌────┬────┬────┬────┬────┐
5PM │    │    │█ N │    │    │
    │    │    │█ O │    │    │
6PM │    │    │█ W │    │    │
    │    │    │█   │    │    │
7PM │    │    │█ █ │    │    │
    │    │  █ │█ █ │ █  │    │
8PM │    │  █ │█ █ │ █  │    │
    └────┴────┴────┴────┴────┘
         ↑           ↑
     Previous     Next
      Shows       Show
```

**Interaction:**
- Swipe left: See future shows
- Swipe right: See past shows
- Tap block: Show tooltip → More Info
- Always auto-recenters on "now" after 3 seconds

**Pros:**
- ✅ Unique, spatial
- ✅ Clear sense of time progression
- ✅ "Now" always visible
- ✅ Natural scrolling

**Cons:**
- ⚠️ Hard to see show titles in blocks
- ⚠️ Limited vertical space for details
- ⚠️ Only shows current day (or few hours)

**Enhancements:**
- Day selector to jump to different days
- Pinch to zoom (see more/less time)
- Show artwork thumbnails in blocks

**Verdict:** Cool concept, may need refinement for usability

---

### Approach 5: Hybrid - Tab-Based Navigation

**Description:** Multiple views accessible via bottom tabs

**Tabs:**
1. **"Now"** - Current show + next 3 shows (list)
2. **"Today"** - Full day schedule (compressed timeline or list)
3. **"Week"** - Week overview (mini grid, tap day to expand)
4. **"Shows"** - Browse all shows A-Z (separate from schedule)

**"Now" Tab Layout:**
```
┌─────────────────────────────┐
│      ● LIVE NOW             │
│  ┌─────────────────────────┐│
│  │ [🎵 Show Artwork]       ││
│  │ The Morning Show        ││
│  │ with DJ Sarah           ││
│  │ Ends at 9:00 AM (2h 15m)││
│  │ [▶ Listen] [More Info]  ││
│  └─────────────────────────┘│
│                             │
│      Up Next                │
│  ┌─────────────────────────┐│
│  │ News Brief              ││
│  │ 9:00 AM - 9:15 AM       ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ Coffee Talk             ││
│  │ 9:15 AM - 10:00 AM      ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**Pros:**
- ✅ Best of all worlds
- ✅ Users choose their preferred view
- ✅ "Now" tab optimized for quick listen
- ✅ Week tab for power users

**Cons:**
- ⚠️ More complex to build
- ⚠️ Users might miss features in other tabs

**Verdict:** 🌟 **Safe, versatile** - covers all use cases

---

### Approach 6: AI/Voice-First (Experimental)

**Description:** Conversational interface with voice control

**Interaction:**
- Home screen shows "Now Playing" + simple schedule
- Floating mic button: "What's on tonight at 8pm?"
- Voice response: "At 8 PM, it's Jazz Hour with Dave"
- Follow-up: "Tell me more" → Full show info
- "Play it" → Starts stream (if live) or plays episode

**Pros:**
- ✅ Hands-free (great for driving, cooking)
- ✅ Natural language queries
- ✅ Accessibility win
- ✅ Future-forward

**Cons:**
- ⚠️ Requires speech recognition/NLU
- ⚠️ Not always practical (quiet environments)
- ⚠️ Fallback to touch is still needed

**Verdict:** 🚀 **Cutting-edge** - could be Phase 2 enhancement

---

## Mobile Layout Recommendation Matrix

| Approach | Ease of Use | Info Density | Innovation | Implementation |
|----------|-------------|--------------|------------|----------------|
| Grid (Compressed) | ⭐⭐ | ⭐⭐⭐⭐ | ⭐ | Easy |
| List View | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Easy |
| Swipeable Cards | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Medium |
| Timeline Scroll | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | Medium |
| Hybrid Tabs | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Hard |
| Voice-First | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Very Hard |

---

## Proposed MVP Approach

**Primary View:** **Hybrid Tabs** (Approach 5)
- Start with **"Now"** tab (most common use case)
- Add **"Today"** list view
- Phase 2: Add **"Week"** overview

**Experimental Alternative:** **Swipeable Cards** (Approach 3)
- Build as A/B test option
- Could be toggled via settings: "Card View" vs "List View"
- Gather user feedback to determine preferred default

**Long-Term Vision:** Add **Voice Control** (Approach 6) as accessibility feature

---

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

1. **Real-Time Listener Count**
   - Display current listener count from Icecast stats
   - Privacy-aware geographic breakdown (country-level only)

2. **Live Chat During Shows**
   - Real-time chat for listeners during live broadcasts
   - Requires WebSocket infrastructure
   - Anonymous chat (no account required)

3. **Mobile App (PWA)**
   - Progressive Web App for install-to-home-screen experience
   - Offline schedule caching
   - Background audio playback

4. **Multi-Language Support**
   - Internationalization (i18n) for station UI
   - Show descriptions in multiple languages

5. **Advanced Analytics Dashboard**
   - Listener metrics and trends
   - Popular shows/episodes
   - Peak listening times

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

- **Next.js with Client-Side Routing**: SPA behavior with smooth transitions between views
- **Modal-Based Navigation**: Show details, episode players open in modals (keeps player state alive)
- **Deep Linking Support**: Direct URLs open modals (e.g., `/shows/morning-show` loads schedule page + opens modal)
- **API Routes**: Public API endpoints separate from admin endpoints
- **Caching Strategy**: 
  - Schedule data: 5-10 minute cache with SWR pattern
  - "Now Playing": 30-60 second polling
  - Episode lists: 15 minute cache
- **SEO Considerations**: 
  - Server-side render initial schedule for search engines
  - Meta tags and Open Graph for social sharing
  - Structured data (Schema.org) for shows/events
- **CDN-Friendly**: Static assets optimized for CDN delivery

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

## Development \u0026 Testing Considerations

### Mock Data Strategy

During development, the schedule will not be fully populated, which affects the "Now Playing" display and related features.

**Approach:**
- **Placeholder Handling**: When no show is currently scheduled, display fallback content:
  - Default station artwork (from Station Identity settings)
  - "No show currently scheduled" or custom message
  - Optional: Display station tagline/description
  - Live stream player still functional (if stream is online)

**Testing Real Data:**
- Move/create shows in the schedule to align with current station time for testing
- Example: Schedule a test show for the next 15 minutes to see "Now Playing" populate
- Test edge cases:
  - Show ending soon (time remaining display)
  - Show just started (elapsed time)
  - Midnight-crossing shows (split slots)
  - Back-to-back shows (transition between shows)

**API Fallback Behavior:**
```javascript
// Example: /api/public/now-playing response when no show scheduled
{
  "currentShow": null,
  "nextShow": {
    "title": "Morning Show",
    "host": "DJ Mike",
    "startTime": "2025-11-24T06:00:00Z",
    "artwork": "/uploads/shows/morning-show.jpg"
  },
  "stationInfo": {
    "name": "WXYZ Radio",
    "tagline": "Your Community Voice",
    "defaultArtwork": "/uploads/station/logo.png"
  }
}
```

### Development Workflow

1. **Seed Data**: Consider creating a seed script to populate schedule with sample shows
2. **Time Travel Testing**: Allow dev mode to override "current time" for testing different schedule states
3. **Stream Mocking**: Mock Icecast stream health checks to test online/offline states
4. **Responsive Testing**: Test on mobile devices (iOS Safari, Android Chrome)

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

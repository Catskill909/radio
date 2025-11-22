# Radio Suite Feature Catalogue

This document is the **source of truth for features** in Radio Suite:

- **Current features** – what exists in the app today.
- **Planned / future features** – ideas and roadmap items, with rough priorities.

Use this file to keep product scope and roadmap aligned with the actual codebase.

---

## 1. Show Management

**Status:** Shipped

- **Rich show metadata**
  - Title, description, type (Local/Syndicated Podcast/Music), category, tags
  - Host, author, email
  - Explicit flag, language, copyright, external link
  - Cover artwork image
- **Create & edit flows**
  - Full-screen create form with grid layout (no vertical scrolling)
  - Scrollable edit modal launched from calendar or show cards
  - Validation for required fields
- **Show listing**
  - Shows index with cards (image, host, type badge, description)
  - Empty state when no shows exist
  - Delete show with confirmation modal (also removes associated schedule slots)

---

## 2. Advanced Scheduling

**Status:** Shipped

- **Calendar UI**
  - Week and day views
  - 15-minute grid (`step=15`, `timeslots=4`) with accurate visual heights
  - Events sized by duration (10, 30, 45, 60+ minutes render correctly)
- **Scheduling workflows**
  - Click an empty time slot to schedule
  - **Select existing show** or **create new show in-place** from the modal
  - Duration selector with recurring weekly toggle
  - Edit existing slot via modal (start time, duration, recurring flag)
  - Delete slot with confirmation
- **Recurring shows**
  - Automatic generation of weekly slots for 12 weeks
  - Visual recurring indicator and styling on calendar events
- **Overlap prevention**
  - Backend validation to block overlapping schedule slots
  - Clear error messages when conflicts occur

---

## 3. Streams & Recording Sources

**Status:** Shipped

- **Icecast streams dashboard**
  - Grid of streams with status indicator (online / offline / testing / disabled)
  - Key metadata: URL, bitrate, format, genre, listeners / max listeners, description
  - Last-checked timestamp with stale-data icon if out of date
- **Health checks**
  - Auto-refresh stream health every 30 seconds via `/api/streams/health`
  - Manual Refresh button per page and per-stream
  - Error messages surfaced inline when a stream is unhealthy
- **Stream management**
  - Add/Edit stream modal (name, URL, etc.)
  - Enable/disable toggle per stream
  - Per-stream manual refresh and delete with confirmation
- **Integration with shows**
  - Streams populate the recording source dropdown for shows
  - Recording source stored with shows and used by the recorder service

---

## 4. Automated Recording & Recorder Service

**Status:** Shipped (base flow), recorder service available as a script

- **Per-show recording configuration**
  - Recording on/off toggle
  - Select recording source from existing Icecast streams
  - Recording config stored on the `Show`
- **Background recorder service (`recorder-service.ts`)**
  - Monitors schedule slots and recording config
  - Starts recording when a scheduled show begins
  - Stops recording when the show ends
  - Writes audio files to `/recordings`
  - Updates recording status in the database
- **Recording lifecycle**
  - Statuses: PENDING, RECORDING, COMPLETED, FAILED
  - Recordings link to schedule slots and shows

---

## 5. Recordings UI

**Status:** Shipped

- **Recordings page**
  - List of recordings with show title, host, date, start/end time
  - Status badge for each recording (Recording, Completed, Failed, Pending)
  - Inline badge when a recording has already been published as an episode
- **Actions**
  - Inline audio player for completed recordings
  - "Publish" button for completed, unpublished recordings
  - Delete recording with confirmation (removes DB row and audio file)

---

## 6. Episodes & Podcast Dashboard

**Status:** Shipped

- **Podcast dashboard (/episodes)**
  - Per-show cards with artwork, title, host, episode count, description
  - Latest episode section with publish date, description, and audio player
  - Fallback empty state when no shows or episodes exist
- **Episode Manager Drawer**
  - Slide-out per-show drawer listing all episodes
  - Episode tiles with artwork, publish date, duration, and status badge
  - Inline audio player per episode (expand/collapse)
  - Edit Episode button to open full metadata editor
- **Publishing flow**
  - Publish-from-recording page to create an episode from a completed recording
  - Episode metadata: title, description, episode #, season #, tags, explicit flag
  - Per-episode overrides: host, artwork
  - `publishedAt`, duration, and file size tracked in DB

---

## 7. Audio Playback

**Status:** Shipped

- **Player implementation**
  - Uses `react-h5-audio-player`
  - Scrubbers fully working (click-to-seek and drag-to-scrub)
  - Duration reliably loads on all pages (podcast dashboard, drawers, recordings)
- **API route**
  - `/api/audio/[filename]` supports HTTP Range requests (206 Partial Content)
  - Proper headers for `Accept-Ranges`, `Content-Range`, `Content-Length`
  - Security checks to avoid directory traversal
- **Usage locations**
  - Podcast dashboard latest-episode players
  - Episode Manager Drawer per-episode players
  - Recordings list inline players for completed recordings

---

## 8. Audio Editing (Waveform Editor)

**Status:** Shipped (admin-only editor)

- **Waveform-based editor**
  - `WaveSurfer`-powered waveform with timeline and zoom
  - Play/pause, seek, and zoom controls
  - Keyboard shortcuts (space for play/pause, arrows to seek, +/- to zoom, `?` for help)
- **Trim & process audio**
  - Create an editable region (middle 50% by default) and adjust handles
  - Trim & Save via `/api/trim-audio` with non-destructive backups
  - Apply fade-in / fade-out with configurable durations
  - Normalize audio via `/api/process-audio`
- **Integration with episodes**
  - Accessible from the Edit Episode modal via "Edit Audio (Trim/Cut)" button
  - Updated duration is fed back into the episode metadata
  - Backup paths and processing success surfaced in the UI
  - Edited audio is what listeners hear in players and podcast feeds

---

## 9. Podcast Feeds & Distribution

**Status:** Shipped

- **Global feed**
  - `/api/feed` returns an RSS feed of all published episodes
- **Per-show feeds**
  - `/api/feed/show/[showId]` for iTunes-compatible show-specific RSS feeds
  - Includes show-level metadata (author, category, explicit, owner, tags, artwork)
  - Episode-level metadata: duration, enclosure (audio), image, dates
- **In-app RSS UI**
  - RSS feed box on Podcast dashboard cards with copy-to-clipboard and open-in-new-tab
  - `PodcastFeed` component for reusable RSS UI
 - **Sync with edits**
   - Changes to show and episode metadata (title, description, artwork, explicit flag) are reflected in the feeds

---

## 10. Admin UI / UX

**Status:** Shipped

- **Layout & navigation**
  - Sidebar navigation for Shows, Schedule, Streams, Recordings, Episodes
  - Auto-collapse of sidebar on Schedule for maximum calendar space
- **Theming & components**
  - Dark theme with TailwindCSS
  - Custom modals for create/edit/delete confirmation
  - Tooltips on calendar events and sidebar when collapsed
  - Date/time pickers with dark theme
- **Feedback & diagnostics**
  - Inline error banners in editors and modals
  - Status badges, spinners, and stale-data indicators across the app

---

## 11. Database & Schema

**Status:** Shipped

- **Core entities**
  - `Show`, `ScheduleSlot`, `Recording`, `Episode`, `IcecastStream`
- **Prisma workflow**
  - SQLite with migrations
  - Documented migration and backup workflow in `PRISMA_WORKFLOW.md`

---

## Future Features & Roadmap

This section is intentionally lightweight – it is meant to be edited as priorities change.

**Priority legend:**

- **P1** – Near-term / high value
- **P2** – Medium-term / nice-to-have
- **P3** – Longer-term / exploratory

### P1 – Near-Term

- **Public-facing listener pages**
  - Public show pages with latest episodes and embedded players
  - Simple station home page ("On Air Now" + upcoming schedule)
- **Recording dashboard**
  - Real-time view of what is recording now
  - Timeline of upcoming recordings and recent failures
  - Retry / restart controls for failed jobs
- **Batch episode editing**
  - Bulk update tags, explicit flag, host, and artwork across multiple episodes
- **Recorder resiliency improvements**
  - Automatic retries on transient stream failures
  - Better logging and error categorization for `recorder-service.ts`

### P2 – Medium-Term

- **Analytics & reporting**
  - Per-show and per-episode download counts (from RSS logs or hosting)
  - Basic time-series dashboards for episode popularity
- **Multi-user support**
  - Authentication and roles (admin / producer / host)
  - Audit trail for schedule and metadata changes
- **Cloud storage for recordings**
  - Configurable remote storage (e.g., S3) instead of local `/recordings` folder
  - Background upload and URL rewrites in RSS feeds
- **Custom recording source URLs**
  - Allow entering arbitrary stream URLs beyond managed Icecast entries

### P3 – Longer-Term / Ideas

- **Advanced scheduling rules**
  - Blackout windows, templates, and copy/paste slots across weeks
- **Listener-focused enhancements**
  - Public "Now Playing" widget driven from schedule and streams
- **Richer audio tooling**
  - Waveform previews in the recordings list
  - Per-episode loudness normalization presets

---

## How to Use This File

- When you **ship a new feature**, move it into the appropriate "Current Features" section and adjust roadmap items.
- When you **start exploring** an idea, add it under P2/P3 first instead of the README.
- Keep `README.md` as a friendly overview; keep _details and decisions_ here.

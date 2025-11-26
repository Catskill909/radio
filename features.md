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
  - Automatic generation of weekly slots ~1 year ahead (52 weeks) with background auto-extension so long-running shows stay scheduled
  - Visual recurring indicator and styling on calendar events
- **Overlap prevention**
  - Backend validation to block overlapping schedule slots
  - Clear error messages when conflicts occur
- **Midnight-Crossing Support**
  - Shows spanning midnight (e.g., 11 PM - 1 AM) are automatically split into two linked slots
  - Visual indicators on the calendar showing the connection between split parts
  - Timezone-aware splitting based on station time
- **Smart Delete System**
  - **Single Instance**: Delete just one specific show (automatically handles both parts of split shows)
  - **This & All Future**: Delete the current show and all future recurring instances
  - Visual warnings for complex deletions (split/recurring) and impact preview
- **Time-Slot-Specific Deletion** 🆕
  - Delete individual time slots without affecting other rebroadcasts of the same show
  - **Example**: If "Talk Radio" airs Monday 3pm, Monday 11pm (rebroadcast), and Tuesday 3pm, deleting Monday 3pm only removes that specific time slot
  - Pattern matching based on day-of-week + time-of-day in station timezone
  - Clear UI messaging: "Delete This Time Slot & All Future - Removes ~52 occurrences of Mondays at 3:00 PM"
  - Preserves other time slots: "Other time slots for this show will not be affected"
  - Critical for radio schedules with multiple daily airings and rebroadcasts
- **User-Friendly Error Handling** 🆕
  - **Error Modals**: Schedule conflicts and validation errors display in informative modal dialogs instead of React error screens
  - **Conflict Details**: Shows conflicting show name, time range, and week number (for recurring shows)
  - **Actionable Suggestions**: Context-specific tips for resolving issues:
    - "Choose a different time slot"
    - "Adjust the duration to avoid the conflict"
    - "Uncheck 'Repeat Weekly' to schedule only this week"
  - **Enhanced Edit Modal Errors**: EditSlotModal displays errors with icon, title, and helpful suggestions section
  - **Consistent Design**: Error modals match the app's dark theme and modal styling
  - **Error Types Handled**:
    - Single slot overlaps
    - Recurring slot overlaps (immediate and future weeks)
    - Midnight-crossing overlaps
    - Validation errors (zero duration, invalid times)

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
  - Active stream URL configurable in Settings for public playback

---

## 3.5 Live Streaming & Public Listen Page

**Status:** Shipped

- **Stream configuration**
  - "Station Audio Stream" setting in Settings page
  - Select active stream from available Icecast streams for public playback
  - Persisted to database in `StationSettings.streamUrl`
- **Public listen page (`/listen`)**
  - Weekly schedule with day tabs (7-day view)
  - Clickable show cards with detail modals
  - Desktop and mobile responsive layouts
- **Unified audio player**
  - Right-aligned card design with all elements consolidated
  - Show artwork, title, host with LIVE badge
  - Time Remaining display with clock icon in styled pill
  - Large play/pause button
  - Loading spinner during stream buffering (3-4 second initial connect)
  - Proper audio event handling (`loadstart`, `canplay`, `error`)
- **Schedule integration**
  - "Now Playing" metadata fetched from `/api/public/now-playing`
  - Time remaining countdown based on schedule
  - Show details and artwork displayed in player

---

### 🎬 Automated Recording & Recorder Service

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
  - Uses the station-wide timezone consistently with the calendar "now" marker
  - **Smart Transcoding**: Automatically detects stream format (e.g., AAC) and transcodes to MP3 if necessary, or uses direct stream copy for MP3 sources
  - **Configurable Encoding**: Applies quality settings from Settings page (codec, bitrate, sample rate, VBR/CBR)
- **Automatic recurring extension**
  - Recurring shows are extended automatically in the background as they approach the end of their scheduled horizon (no manual upkeep required for long-running programs)
- **Recording lifecycle**
  - Statuses: PENDING, RECORDING, COMPLETED, FAILED
  - Recordings link to schedule slots and shows
  - Quality metadata saved on completion (codec, bitrate, sample rate)

---

## 4.5. Audio Encoding Quality

**Status:** Shipped

- **Settings UI**
  - **Codec selector** - MP3 (libmp3lame), AAC, Opus (libopus), FLAC
  - **Bitrate slider** - 64 to 320 kbps with real-time value display
  - **Sample rate dropdown** - Auto (from source), 22.05kHz, 44.1kHz, 48kHz
  - **VBR/CBR toggle** - Variable bitrate (recommended) vs Constant bitrate
  - **Quality presets** - Quick configurations:
    - Voice: 96kbps MP3, 22.05kHz (podcasts, talk shows)
    - Music: 192kbps MP3, Auto sample rate (recommended default)
    - Archival: FLAC lossless, 48kHz (maximum quality)
  - **File size calculator** - Real-time estimates per hour of recording
  - **Unsaved changes indicator** - Save button pulses blue with asterisk when settings modified
  - **Database persistence** - Settings stored in `StationSettings` table
- **Recorder integration**
  - Encoding settings applied during recording start
  - Falls back to safe defaults (192kbps MP3 VBR) if settings unavailable
  - Quality parameters logged in console for debugging
- **Recording metadata tracking**
  - New recordings save quality settings used: `audioCodec`, `audioBitrate`, `audioSampleRate`
  - Database fields added to `Recording` model
  - Quality badges displayed in recordings view
  - Existing recordings unaffected (no retroactive metadata)
- **Display in recordings view**
  - Quality badges show codec (MP3/AAC/Opus/FLAC), bitrate, and sample rate
  - Example: `[MP3] [192 kbps] [48.0 kHz]`
  - Badges only appear for recordings with quality metadata

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
  - Sidebar navigation for Shows, Schedule, Streams, Recordings, Episodes, Settings
  - Auto-collapse of sidebar on Schedule for maximum calendar space
  - Settings page for station-wide configuration (timezone, stream, audio encoding quality)
  - **Icon updates** - Settings uses Font Awesome gear icon (fa-gear)
- **Theming & components**
  - Dark theme with TailwindCSS
  - Custom modals for create/edit/delete confirmation
  - Tooltips on calendar events and sidebar when collapsed
  - Date/time pickers with dark theme
- **UI aesthetic refinements**
  - Consistent darker color palette across buttons and controls
  - Stream cards with darker gray edit buttons and toggle switches
  - Bordered button style for Create Show actions
- **Enhanced feedback & UX**
  - Inline error banners in editors and modals
  - Status badges, spinners, and stale-data indicators across the app
  - **Unsaved changes detection** - Save buttons highlight blue with pulse animation when changes made
  - Success confirmations with green highlighting

---

## 12. Station Identity & Settings

**Status:** Shipped

- **Station Identity**
  - **Station Name**: Global name used for RSS feeds, public pages, and browser titles
  - **Description/Tagline**: Station tagline or description used in metadata
  - **Contact Email**: Default owner email for podcast feeds and public contact
  - **Station Artwork**: Default logo/artwork used as a fallback for shows without their own cover image
- **Settings Page**
  - Dedicated settings area for managing station identity
  - Drag-and-drop image uploader for station logo
  - Real-time validation and feedback
  - **Station Timezone**: Global timezone setting with live clock
  - **Station Audio Stream**: Select active Icecast stream for public listen page
  - **Audio Encoding Quality**: Configure recording quality (codec, bitrate, sample rate, VBR/CBR)
    - Quality presets for quick configuration
    - Real-time file size estimates
    - Unsaved changes detection with visual feedback
  - Two-column grid layout for optimal space utilization

---

## 13. In-App Help System

**Status:** Shipped

- **Contextual Help**
  - **Help Icons**: `?` icons placed strategically next to complex features (e.g., Settings, Schedule)
  - **Tooltips**: Hover text explaining the purpose of the help icon
  - **Direct Linking**: Icons open the help browser directly to the relevant article
- **Help Browser Modal**
  - **Full-Screen Experience**: Immersive modal for reading documentation without leaving the app
  - **Markdown Rendering**: Rich text support with headers, lists, code blocks, and images
  - **Search Functionality**: Real-time search across all help articles
  - **Sidebar Navigation**: Categorized list of all available help topics
- **Content Management**
  - **Markdown-Based**: Help articles stored as Markdown files for easy editing
  - **Categorized**: Articles grouped by topic (Getting Started, Scheduling, etc.)
  - **Searchable**: Content indexed for fast retrieval

---

## Future Features & Roadmap

This section is intentionally lightweight – it is meant to be edited as priorities change.

**Priority legend:**

- **P1** – Near-term / high value
- **P2** – Medium-term / nice-to-have
- **P3** – Longer-term / exploratory

### P1 – Near-Term

- **Enhanced Settings & Station Configuration**
  - **Recording Behavior**
    - Pre-roll buffer: "Start recording X seconds early" to prevent cut-offs
    - Post-roll buffer: "Keep recording X seconds after scheduled end" to catch overruns
    - Auto-delete unpublished recordings after X days (storage management)
    - Recording file naming template customization
  - **Auto-Extension Configuration**
    - Extension trigger: "Extend when less than X weeks remain" (currently hardcoded to 4 weeks)
    - Extension duration: "Extend by X weeks" (currently hardcoded to 52 weeks)
  - **UI Preferences**
    - Calendar time granularity options: 5min / 15min / 30min slots
    - Default show duration templates for quick creation
    - Week start day preference: Sunday vs Monday for calendar
  - **Episode Publishing Controls**
    - Toggle auto-publish recordings on/off (currently always enabled)
    - Default episode numbering scheme: sequential vs date-based vs manual
  - **Advanced Encoding Options** (future enhancements)
    - Per-show encoding overrides (different quality per show)
    - Real-time bitrate adjustment during recording
    - Multiple simultaneous quality levels (high-quality archive + lower podcast version)
- **Aggregator URL fields (future)** – Optional fields on Show setup/edit forms for Apple Podcasts, Spotify, Amazon Music, TuneIn Radio, iHeartRadio, Podcast Index (basic fields only). When populated, corresponding icons/links appear in the front‑end; otherwise they are hidden.
- **Enhanced public listen experience**
  - Show detail pages with episode archives
  - Host bio pages with all shows by that host
  - Embedded schedule widgets for external websites
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

- **Public-Facing Listener Experience** (Inspired by Airtime Pro & LibreTime)
  - **Station Microsite**: A dedicated public landing page (`/public`) featuring:
    - "On Air Now" player with live metadata
    - Visual weekly schedule grid (read-only version of admin calendar)
    - Show pages with descriptions, host bios, and episode archives
  - **Embeddable Widgets**:
    - **Schedule Widget**: Drop-in script to show "Upcoming Shows" on external station websites
    - **Player Widget**: Portable live stream player
    - **Now Playing**: Simple JSON/HTML endpoint for current show metadata
  - **Public API**: Read-only REST API for developers to build custom frontends

- **Analytics & Reporting**
  - Per-show and per-episode download counts
  - Listener peak times and geographic breakdown (via Icecast stats)
  - Retention graphs for podcast episodes

### P3 – Longer-Term / Ideas

- **Advanced Automation & Production** (Inspired by Rivendell)
  - **Remote Voice Tracking**: Web interface for hosts to record links/intros between tracks from home
  - **Cloud Library Management**: Upload and tag music/content remotely
  - **Log/Clock Management**: Define strict rotation rules and hour templates

- **System Enhancements**
  - **Multi-user Roles**: Granular permissions (Admin vs. DJ vs. Scheduler)
  - **Cloud Storage**: S3-compatible backend for recordings and assets
  - **Visual Waveform Previews**: In-browser scrubbing for all library content

---

## How to Use This File

- When you **ship a new feature**, move it into the appropriate "Current Features" section and adjust roadmap items.
- When you **start exploring** an idea, add it under P2/P3 first instead of the README.
- Keep `README.md` as a friendly overview; keep _details and decisions_ here.

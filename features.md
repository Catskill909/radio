# StationDock Feature Catalogue

This document is the **source of truth for features** in StationDock:

- **Current features** – what exists in the app today.
- **Planned / future features** – ideas and roadmap items, with rough priorities.

Use this file to keep product scope and roadmap aligned with the actual codebase.

---

## Design Philosophy

StationDock is built with intentional design choices that prioritize a premium, modern user experience:

### Modern Space Utilization
- **Full-viewport layouts** that use available screen real estate without feeling crowded
- **Information-dense yet scannable** – schedule cards, show tiles, and player controls surface rich data in compact, readable formats
- **Persistent elements done right** – the audio player is always accessible but never intrusive

### Modal-First Architecture
- **Context preservation** – modals keep users in their current flow instead of navigating to separate pages
- **Progressive disclosure** – show details, episode info, and settings surface as focused overlays
- **Actionable overlays** – the floating menu on `/listen` offers both URL links and custom modal content, going beyond typical implementations

### Dark Theme Excellence
- **More than "make it dark"** – proper contrast ratios, visual depth, and clear hierarchy
- **Consistent across experiences** – admin dashboard and public listen page share the same refined aesthetic
- **Subtle polish** – glassmorphism effects, smooth transitions, and hover states that feel premium

### Attention to UX Details
- **Time remaining pill** with ceiling-rounded math (never shows "0m" while a show is live)
- **Loading states everywhere** – spinners during buffering, stale-data indicators, progress feedback
- **Auto-scroll behaviors** – modals scroll to reveal relevant options when state changes
- **Responsive by default** – desktop and mobile layouts adapt without compromising functionality

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
  - **Visual Show Picker** 🆕: Compact card grid with images, titles, and type badges for browsing shows
    - Search/filter by title, host, or type
    - Alphabetically sorted for easy navigation
  - **Guided UX flow** 🆕: After selecting a show, modal auto-scrolls to reveal Duration/Repeat settings with cards peeking at the top as visual anchor
  - **Inline show editing**: When selecting existing show, full show settings (metadata, recording) are exposed for review/editing before scheduling
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
- **Real-time monitoring** 🆕
  - WebSocket-powered "Live" indicator confirms active connection
  - Stream status changes push instantly to clients (no page refresh needed)
  - Recording events (started/completed/failed) broadcast in real-time
  - Now Playing: show transitions push to Listen page instantly
  - Automatic fallback to polling (60s) if WebSocket unavailable
- **Stats Dashboard** 🆕
  - Dedicated `/stats` page in admin sidebar
  - WebSocket connection status display
  - **Live site listener count** - tracks users actively playing audio
  - Stream health summary (online/offline counts)
  - Live recording event log (started/completed/failed events)
- **Listener Analytics** 🔮 *(Future Development)*
  - Historical listener stats (today, this week, this month)
  - See [docs/listener-analytics.md](docs/listener-analytics.md) for implementation plan

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
  - **Time Remaining display** with clock icon in styled pill
    - Ceiling-rounded math prevents "0m" display while show active
    - 30-second polling for responsive updates
  - Large play/pause button
  - Loading spinner during stream buffering (3-4 second initial connect)
  - Proper audio event handling (`loadstart`, `canplay`, `error`)
- **Schedule integration**
  - "Now Playing" metadata fetched from `/api/public/now-playing`
  - Time remaining countdown based on schedule
  - Show details and artwork displayed in player
- **Custom Floating Menu**
  - Configurable hamburger-style menu in bottom-right corner
  - Up to 8 menu items with drag-and-drop reordering
  - Two action types: URL (opens in new tab) or Modal (popup overlay)
  - **Modal Size Controls**: Choose Compact, Standard, or Expanded width presets per modal
  - Responsive modal design: sized on desktop, full-screen overlay on mobile
  - Font Awesome icon picker with live preview
  - Master toggle to show/hide entire menu
  - Settings UI in admin panel for easy configuration

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
- **Per-Slot Recording Control** 🆕
  - **Override Show Defaults**: Toggle recording on/off for individual broadcast instances
  - **Scope Selector**: Choose "This broadcast only" or "All future broadcasts" when changing recording status
  - **Clear Status Display**: Visual indicator showing "Will Record" or "Will Not Record" with explanation
  - **Recurring Show Support**: Changes can apply to single date or all future occurrences of that day/time
  - **Use Case**: Disable recording for replays/rebroadcasts while keeping original broadcasts recorded
  - **Database**: `recordingOverride` field on `ScheduleSlot` (null = use show default, true/false = override)
  - **Auto-Scroll UX**: Modal scrolls to reveal scope options when toggle is changed
- **Self-Healing & Recovery** 🆕
  - **File Verification**: Recordings verify file exists and has content before marking COMPLETED; marks FAILED if file is missing or too small (<1KB)
  - **Orphan Recovery**: On service restart, detects recordings stuck in RECORDING status and finalizes or marks as failed
  - **Automatic Backup Cleanup**: Removes old `.backup_` files from audio editing (>7 days) to prevent accumulation
  - **Graceful Degradation**: Service continues operating even if individual recordings fail

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
  - **Pulsing CTA buttons** 🆕 - Schedule Show button pulses with glowing border to draw attention
  - **Modal state reset** 🆕 - Modals reset to initial state (scroll position, selected items, active tab) when reopened

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

## 12.5. Admin Authentication

**Status:** Shipped

- **Password Protection**
  - Single admin password stored as environment variable (`ADMIN_PASSWORD`)
  - Branded login page with StationDock logo
  - Password field with show/hide toggle (eye icon)
  - Automatic redirect to requested page after login
- **Cookie-Based Sessions**
  - HTTP-only cookies prevent XSS attacks
  - Secure flag ensures HTTPS-only in production
  - SameSite strict prevents CSRF attacks
  - 7-day session expiry with automatic timeout
- **Public vs Protected Routes**
  - `/listen` remains publicly accessible without login
  - `/api/public/*` and `/api/feed/*` remain open for RSS and external apps
  - All admin pages require authentication
- **Logout**
  - Sign Out button in sidebar navigation
  - Clears session cookie and redirects to login

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

## 14. Import/Export \u0026 Data Migration

**Status:** Shipped

- **Export Functionality**
  - **One-Click Export**: Download all shows, schedules, and images as a single ZIP file
  - **Automated Packaging**: Creates `data.json` with database records + `images/` folder with artwork
  - **Sanitized Data**: Automatically removes site-specific settings (recording sources) for clean migration
  - **Date-Stamped Files**: Export filename includes date for easy version tracking
- **Import Functionality**
  - **Replace All Strategy**: Wipes existing shows/schedules and restores from ZIP (clean slate)
  - **Progress Feedback**: Real-time status messages during 30-60 second import process
  - **Confirmation Modal**: Critical warning before destructive operation
  - **Image Restoration**: Extracts and restores all show artwork to uploads directory
  - **Transaction Safety**: Database operations wrapped in transaction for integrity
- **UI Integration**
  - **Settings Page Location**: Data Management card in Settings
  - **Export Button**: Simple download link to `/api/export`
  - **Import Button**: File picker with validation and confirmation flow
  - **Status Display**: Success/error messages with clear feedback
- **Use Cases**
  - **Migration**: Move from local development to production
  - **Backups**: Regular exports for disaster recovery
  - **Cloning**: Replicate station configuration to new instance
- **Technical Details**
  - **ZIP Format**: JSZip library for archive creation/extraction
  - **File Size Limit**: 100MB maximum (configurable in `next.config.ts`)
  - **Async Processing**: Image restoration outside database transaction to prevent timeout
  - **Volume Requirements**: `/app/uploads` persistent volume required in production

---

## 15. Image Optimization

**Status:** Shipped

- **Automatic Variant Generation**
  - On upload, images are processed via `sharp` to create optimized variants
  - **Original**: Full resolution (1400x1400+) preserved for podcast feeds and exports
  - **Card variant**: 600x600px for show grids and podcast cards
  - **Icon variant**: 150x150px for schedule cards and player thumbnails
- **Frontend Integration**
  - `getImageUrl(url, variant)` helper selects appropriate size
  - Show cards, podcast cards, schedule cards, and player all use optimized variants
  - External URLs and non-upload images pass through unchanged
- **Migration Script**
  - `scripts/generate-images.ts` backfills variants for existing images
  - Run once in production after deployment: `npx tsx scripts/generate-images.ts`
- **Performance Benefits**
  - Significantly faster page loads on `/shows`, `/episodes`, `/listen`
  - Reduced bandwidth usage for visitors
  - Original high-resolution images still used for RSS feeds

---

## 16. Accessibility

**Status:** Shipped

- **Keyboard Navigation**
  - Full Tab navigation through all interactive elements
  - Visible focus rings on buttons, tabs, and controls
  - Arrow key navigation within date tabs
  - Enter/Space activation for buttons and toggles
- **Screen Reader Support**
  - ARIA labels on all icon-only buttons (play/pause, close, navigation)
  - Descriptive date labels on day tabs (e.g., "Friday, December 6")
  - Proper heading hierarchy throughout the application
- **Focus Management**
  - Modals built with Radix Dialog for automatic focus trapping
  - Focus returns to trigger element when modals close
  - Escape key closes all modals
- **Technical Implementation**
  - `@radix-ui/react-dialog` for accessible modal primitives
  - `eslint-plugin-jsx-a11y` for ongoing accessibility linting
  - WCAG-aligned patterns for interactive elements

---

## 17. Public API

**Status:** Shipped

StationDock provides a comprehensive JSON API for integrating with external apps, websites, and mobile applications.

- **Core Endpoints**
  - `GET /api/public/now-playing` – Current show, next show, station branding
  - `GET /api/public/schedule` – Schedule slots for date range with show details
  - `GET /api/public/shows` – All shows with pagination, filtering, and sorting
  - `GET /api/public/shows/[id]` – Single show details with episodes
  - `GET /api/public/station` – Station metadata, branding, and stream URL
  - `GET /api/public/streams` – Enabled streams with health status
  - `GET /api/public/recordings` – Completed recordings archive
  - `GET /api/public/podcasts` – Shows with full RSS feed URLs (environment-aware)
- **RSS Feeds**
  - `GET /api/feed` – Global RSS 2.0 feed for all published episodes
  - `GET /api/feed/show/[showId]` – Per-show iTunes-compatible RSS feed
- **Pagination & Filtering**
  - All list endpoints support `?limit=10&offset=0&sort=recent` query parameters
  - Filter shows by type (`?type=Music`) or host (`?host=DJ`)
  - Sort options: `recent`, `oldest`, `alphabetical`
- **Use Cases**
  - Mobile app integration (now playing + schedule + shows)
  - Website widgets (now playing display)
  - External schedule displays (lobby screens, digital signage)
  - Podcast directory submission (RSS feeds)

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

- **WebSocket Schedule Sync** (Planned)
  - Multi-user admin environments see schedule changes instantly
  - Real-time slot creation/deletion pushed to all connected clients
  - Benefits: Zero-latency updates for collaborative editing

- **Embeddable Widgets** (Planned)
  - **Schedule Widget**: Drop-in `<script>` for external websites showing day's schedule
  - **Player Widget**: Portable embed player with now-playing display
  - Configurable styling to match host site

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

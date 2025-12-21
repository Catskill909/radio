# StationDock 📻

**A modern, all-in-one radio station management system.**

> **⚠️ AI AGENT NOTE:** Do NOT use browser_subagent or browser testing tools on this project. The user will perform all manual testing. Browser automation slows down the machine significantly.

StationDock combines a powerful **admin dashboard** for scheduling and automation with a clean **public-facing listener site**. It handles everything from planning your weekly grid to recording live broadcasts and automatically publishing them as podcasts.

### Key Capabilities:
- **Public Listener Experience**: An animated public schedule with a persistent live audio player and "Now Playing" metadata.
- **Advanced Scheduling**: Click-to-schedule calendar with conflict detection, recurring show automation, and timezone awareness.
- **Automated Recording**: Background service that records shows from Icecast streams, with smart transcoding and configurable quality (MP3/AAC/FLAC).
- **Podcast Publishing**: Turn recordings into podcast episodes with one click, complete with iTunes-compatible RSS feeds.
- **Import/Export**: Migrate your entire station (shows, schedules, images) between environments with a single ZIP file.
- **Station Management**: comprehensive settings for station identity, stream monitoring, and audio encoding preferences.

## Features

- **Show management** – Create and manage shows with rich metadata (host, artwork, type, tags, explicit flag, recording config).
- **Click-to-schedule calendar** – Calendar-based week/day views with recurring slots, conflict prevention, tooltips, and edit modals.
- **Station-wide timezone** – Single global station timezone configurable in Settings; schedule views, the live clock, and the recorder service all use station time, independent of user or server location.
- Automated recording – Per-show recording toggles, Icecast stream source selection, background recorder service, and status tracking.
  - **Smart transcoding**: automatically detects stream format (e.g., AAC) and transcodes to MP3 when needed, otherwise copies the stream directly.
- **Auto-extending recurring shows** – Weekly shows are generated roughly a year ahead and automatically extended in the background so long-running programs keep their slots without manual upkeep.
- **Recordings & episodes** – Turn live recordings into podcast episodes with post-recording episode metadata editing (titles, descriptions, explicit flag, etc.).
- **Audio playback & editing** – Scrub-enabled audio player across the app plus an in-browser waveform editor to trim, fade, and normalize recordings before publishing.
- **Podcast feeds** – Global RSS feed and per-show iTunes-compatible RSS feeds that automatically reflect show/episode edits, with in-app copy/open UI.
- **Stream monitoring** – Icecast streams dashboard with health checks, status badges, bitrate/listener stats, and error diagnostics.
- **Real-time updates** – WebSocket-powered "Live" indicator; instant stream health, recording status, and show transition notifications push to your browser in real-time.
- **Stats dashboard** – Dedicated `/stats` page showing live site listener count, stream health, real-time recording event log, and **engagement analytics** with episode play tracking from the public listen page.
- **Live streaming** – Configure active audio stream in Settings; public listen page with live player, loading indicators, and buffering feedback.
- **Station Identity** – Configure station name, description, email, and default artwork in Settings; used for RSS feeds and public metadata.
- **Modern admin UI** – Dark theme, responsive layout, modals, tooltips, Settings page, and keyboard shortcuts in the editor workflows.

### 🎙️ Show Management
- Create and manage radio shows with rich metadata
- Host information tracking
- Show type categorization (Local/Syndicated Podcast/Music)
- Cover image support
- Custom descriptions

### 🆔 Station Identity
- **Centralized Configuration** - Manage station name, description, and contact info in one place
- **Default Artwork** - Upload a station logo that serves as a fallback for shows without covers
- **RSS Integration** - Station details automatically populate podcast feed metadata

### 📅 Advanced Scheduling
- **Click-to-add scheduling** with a simple visual calendar
- **Visual Show Picker** – Browse shows in a compact card grid with images, titles, and type badges; search/filter by title, host, or type
- **Guided UX flow** – Auto-scrolling modal guides users from show selection → duration settings → scheduling with visual anchors
- **Recurring shows** – Automatically generate weekly slots ~1 year ahead (52 weeks) with background auto-extension so successful shows can run for years.
- **Visual indicators** – Yellow left border for recurring shows
- Week and day views
- Click events to create and edit shows directly from the calendar
- **Inline show editing** – View and edit full show settings when scheduling existing shows
- **Enhanced tooltips** – Hover over any show to see detailed information:
  - Show name, type, and time range
  - Duration and split-show indicators
  - **Recurring status** – "Recurring Weekly" or "One-Time Broadcast"
  - **Recording status** – "Recording On" (with pulsing indicator) or "Recording Off"
- **User-friendly error handling** – Schedule conflicts and validation errors display in helpful modal dialogs with:
  - Clear conflict details (conflicting show name and time)
  - Actionable suggestions for resolution
  - No more React error screens or basic browser alerts

### ⏰ Station Time (One Truth)
- Set a single **station timezone** in Settings (e.g. `America/New_York`).
- All schedule views, the red "now" marker, and the Station Clock use this timezone.
- The recorder service fires recordings based on **station wall-clock time**, not the server's or user's local timezone.
- Example: If the station is set to `America/New_York` and you schedule a show at 3:00 PM, users in Los Angeles and London still see it at 3:00 PM station time, and recordings start at that NY 3:00 PM.

### 🎬 Automated Recording
- **Toggle recording** on/off per show
- **Recording source selection** via dropdown
- Automatic recording when shows are scheduled
- Background recording service monitors schedule using station time
- Recording status tracking (PENDING/RECORDING/COMPLETED/FAILED)
- **Auto-publishing** - Recordings automatically become podcast episodes
- **Per-slot recording control** - Override show defaults for individual time slots:
  - Toggle recording on/off per broadcast instance
  - Scope selector: "This broadcast only" or "All future broadcasts"
  - Clear status indicators showing what will record
  - Perfect for disabling replays while keeping original broadcasts recorded
- **Automatic recurring extension** – Background job extends recurring shows as they approach the end of their scheduled horizon so long-running series never silently fall off the calendar.
- **Smart transcoding**: Automatically detects stream format and transcodes when needed
- **Configurable quality**: Control encoding settings from Settings page
- **Self-healing recovery**: Verifies files before marking complete, recovers orphaned recordings on restart + every 15 minutes, detects stuck recordings from deleted/disabled slots, auto-cleans old backup files

### 🎛️ Audio Encoding Quality
- **Codec selection** - MP3, AAC, Opus, or FLAC
- **Bitrate control** - 64-320 kbps with visual slider
- **Sample rate options** - Auto, 22.05kHz, 44.1kHz, 48kHz
- **VBR/CBR toggle** - Variable vs constant bitrate encoding
- **Quality presets** - Quick configs for Voice, Music, or Archival quality
- **File size estimates** - Real-time calculation per hour of recording
- **Recording metadata** - New recordings track quality settings used
- **Quality badges** - Recordings view displays codec, bitrate, and sample rate

### 🎧 Audio Playback
- **Custom audio player** with play/pause controls
- Real-time progress bar and duration display
- In-browser playback for recordings and episodes
- Responsive design with modern styling

### ✂️ Audio Editing
- **Modern waveform editor** with WaveSurfer.js
- **Trim tool** - Click and drag to select portions, delete unwanted sections
- **Fade controls** - Apply fade-in/fade-out (0.5-5 seconds) to smooth transitions
- **Normalization** - Auto-detect peaks, normalize to target levels (-3dB to -1dB)
- **VU meter display** - Real-time audio level monitoring with three modes:
  - **Peak meters** - Accurate digital peak levels with L/R channels
  - **Analog VU meters** - Vintage-style ballistic meters with calibration
  - **None** - Hide meters for distraction-free editing
- **VU calibration** - Adjust reference level (0 VU = -20dB to 0dB) for proper headroom
- **Visual waveform** - Zoomable with click-to-navigate overview
- **Loop playback** - Test edits by looping selected regions
- **Undo support** - Revert changes before saving
- **Downloadable results** - Save edited audio directly from browser
- **Audio Metering** - Professional-quality meters for monitoring levels:
  - **Peak Meter**: Modern fast-response peak meters with broadcast-standard color zones (green/yellow/red)
  - **Analog VU Meters**: Classic needle-style VU meters with realistic ballistics (~300ms attack/decay) and RMS calculation
  - **Meter Toggle**: Switch between Peak, VU, or None with a single click
- **Non-destructive backups** - original audio is preserved before any edit
- **Keyboard shortcuts** - space (play/pause), arrows (seek), `?` for help
- **Processing feedback** - clear status messages for long operations
- Integrated into the episode editing workflow via "Edit Audio" button

### 🎨 Modern UI/UX
- **Full-screen create form** with grid layout (no scrolling needed)
- **Popup date/time pickers** with dark theme
- **Custom delete confirmation modals** (no browser defaults)
- **Scrollable edit modals** when clicking calendar events
- **Hover tooltips** on calendar events showing complete details
- **Settings view** for station-wide configuration (currently a timezone selector with live station clock, with more controls planned)
- Responsive design with dark theme
- Smooth animations and transitions

### 📡 Podcast Distribution
- **Per-show RSS feeds** for podcast apps
- **Modal UI** for feed URLs with one-click copy
- iTunes-compatible podcast metadata
- Automatic episode metadata from show info
- Publishing controls and metadata editing

### 📰 RSS Episode Controls & Archiving
- **Per-show feed limits** – Preset buttons (2♪, 5, 10, 20...∞) or custom number
- **Archiving toggle** – Keep old episodes on disk or auto-delete beyond limit
- **Auto-cleanup** – When archiving is OFF, oldest episodes are removed automatically
- **Visual stats** – Podcast cards show "X in feed · Y archived" badges
- **Archive Management** in Settings – Download or delete archived episodes by show


### 📶 Stream Monitoring & Health
- Icecast streams dashboard with add/edit/delete flows
- Enable/disable streams with a single toggle
- Automatic health checks every 30 seconds plus manual refresh
- Live metadata: status, bitrate, format, listeners, genre, and last-checked time
- Inline error messages and stale-data indicators when streams are unhealthy

### 📻 Live Streaming & Listen Page
- **Stream Configuration** – Select active audio stream from available Icecast streams in Settings
- **Public Listen Page** – Dedicated `/listen` route with schedule and live player
- **Unified Audio Player Card** – Right-aligned player with show artwork, title, host, time remaining, and play/pause controls
- **Loading Indicators** – Spinner during stream buffering with visual feedback
- **Responsive Design** – Desktop and mobile layouts with collapsing headers
- **Custom Floating Menu** – Configurable hamburger menu with drag-and-drop ordering, link to URLs or display custom modal content with size controls (Compact/Standard/Expanded) and a built-in WYSIWYG rich text editor for formatting modal content

### 🎵 Song Recognition (ACRCloud)
- **Automatic Song Identification** – Identify songs playing on your stream via ACRCloud audio fingerprinting
- **Intelligent Bitrate Detection** – Automatically analyzes streams to detect actual bitrate (works even if Icecast doesn't provide metadata)
- **Stream-Optimized Capture** – Dynamically adjusts audio capture duration based on stream bitrate for optimal recognition
- **Settings Integration** – Configure API credentials directly in the Settings page
- **Usage Monitoring** – Monthly request limit tracking with visual indicators and warnings
- **Test Mode** – Preview stream audio and test identification before enabling
- **Rich Metadata Display** – Shows cover art, song title, artist, and album
- **Production Ready** – Supports environment variables for secure credential management in production

### ♿ Accessibility
- **Keyboard Navigation** – Full keyboard support for all interactive elements with visible focus indicators
- **Screen Reader Support** – ARIA labels on buttons, modals, and navigation elements
- **Focus Management** – Modals trap focus inside and restore it when closed
- **WCAG-Aligned** – Built with accessibility best practices using Radix UI primitives

### 🔐 Admin Authentication
- **Password Protection** – Secure admin access with environment variable-based password
- **Cookie-Based Sessions** – HTTP-only cookies with 7-day expiry
- **Public Listen Page** – `/listen` remains publicly accessible without login
- **Secure by Default** – HTTPS-only cookies, signed tokens, automatic session timeout

### 🔌 Public API
StationDock provides a comprehensive JSON API for integrating with external apps, websites, and services:

**Core Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `GET /api/public/now-playing` | Current show, next show, station branding |
| `GET /api/public/schedule` | Schedule slots for date range |
| `GET /api/public/shows` | All shows with pagination |
| `GET /api/public/shows/[id]` | Single show details |
| `GET /api/public/station` | Station metadata & branding |
| `GET /api/public/streams` | Enabled streams with health |
| `GET /api/public/recordings` | Completed recordings archive |
| `GET /api/public/podcasts` | Shows with full RSS feed URLs |

**RSS Feeds:**
| Endpoint | Description |
|----------|-------------|
| `GET /api/feed` | Global RSS feed (all shows) |
| `GET /api/feed/show/[showId]` | Per-show iTunes-compatible RSS |

**Pagination:** All list endpoints support `?limit=10&offset=0&sort=recent` query parameters.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Calendar:** react-big-calendar
- **Date/Time:** react-datepicker with custom dark theme
- **Backend:** Next.js Server Actions
- **Database:** SQLite + Prisma ORM
- **Recording:** FFmpeg (fluent-ffmpeg)
- **Image Processing:** Sharp (automatic variant generation)
- **Icons:** lucide-react

## 🚀 Deployment

StationDock is designed to be deployed as a single container (Monolith) using **Docker** or **Coolify**.

- **Strategy:** "SQLite Everywhere" (Production DB is a persistent file)
- **Stack:** Next.js + Background Recorder Service (managed by PM2)
- **Requirements:** Persistent volumes for Data, Recordings, and Uploads.

👉 **[Read the Full Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)**

---

### ☁️ Coolify Quick Setup

#### Environment Variables

**Required:**

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `file:/app/data/dev.db` | SQLite database path (persistent volume) |
| `ADMIN_PASSWORD` | `your-secure-password` | Password for admin login |
| `NODE_ENV` | `production` | Enables production optimizations |
| `NIXPACKS_NODE_VERSION` | `20` | Node.js version for Nixpacks build |

**Optional:**

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_BASE_URL` | `https://your-domain.com` | Your public URL for RSS feeds |
| `ACRCLOUD_HOST` | `identify-us-west-2.acrcloud.com` | ACRCloud API host (for song recognition) |
| `ACRCLOUD_ACCESS_KEY` | `your-access-key` | ACRCloud access key |
| `ACRCLOUD_ACCESS_SECRET` | `your-access-secret` | ACRCloud access secret |

#### Persistent Storage (Required)

Add these 3 volumes in Coolify → **Storages**:

| Name | Container Path | Purpose |
|------|----------------|---------|
| **Database** | `/app/data` | SQLite database file |
| **Recordings** | `/app/recordings` | Audio recordings from shows |
| **Uploads** | `/app/uploads` | Show artwork and images |

> ⚠️ **Critical:** Do NOT use `/app/prisma` for database storage (conflicts with schema files).

#### Post-Deploy Steps

```bash
# In Coolify terminal, initialize the database:
npx prisma migrate deploy

# If schema changes were made (REQUIRED for new columns):
npx prisma db push
```

> **Note:** You may see `pm2 restart all` in older docs. This is optional—the app works immediately after `prisma db push` since Prisma uses dynamic queries. If pm2 commands fail in Coolify's terminal, the database update still succeeds.

---

### 🖥️ Server Sizing Guide

**Recommended: Contabo Cloud VPS 30 NVMe or equivalent**

| Specs | VPS 30 | Handles |
|-------|--------|---------|
| **RAM** | 24GB | Comfortable for 8+ projects |
| **CPU** | 8 cores | Audio recording + streaming |
| **Storage** | 400GB NVMe | Years of recordings |
| **Bandwidth** | 600 Mbit/s | 1000+ concurrent listeners |

**Capacity for StationDock:**
- ✅ Hundreds of concurrent `/listen` page users
- ✅ Multiple simultaneous MP3 streams (128kbps × 500 users = 64 Mbit/s)
- ✅ Background recording + transcoding
- ✅ All 8 Coolify projects running

**Server Maintenance Tips:**
- Add swap space (4GB recommended): `sudo fallocate -l 4G /swapfile`
- Clean Docker regularly: `docker system prune -af`
- Reboot monthly during low-traffic periods
- Monitor memory: `docker stats --no-stream`

---

### 💻 Local Development

#### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- FFmpeg (for recording functionality)

#### Installation

1. Clone the repository:
```bash
git clone https://github.com/Catskill909/radio.git
cd radio
```

2. Install dependencies:
```bash
npm install
```

3. Install FFmpeg (required for recording):
   
   **macOS:**
   ```bash
   brew install ffmpeg
   ```
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt-get install ffmpeg
   ```
   
   **Windows:**
   Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

4. Set up the database:
```bash
npx prisma migrate dev
```

5. Create a `.env` file:
```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD=your-secure-password-here
# NEXT_PUBLIC_BASE_URL is optional - RSS feeds auto-detect domain from requests
```

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## ⚠️ Database Management (IMPORTANT)

This project uses Prisma with SQLite. **Follow these rules to avoid data loss:**

### Making Schema Changes

**ALWAYS** run migrations after editing `prisma/schema.prisma`:

```bash
# Edit prisma/schema.prisma, then immediately run:
npx prisma migrate dev --name describe_your_change
```

### Quick Commands

```bash
npm run db:backup      # Create timestamped backup
npm run db:studio      # Open database browser UI
npm run db:migrate     # Run migrations
npx tsx scripts/generate-images.ts              # Generate upload image variants
npx tsx scripts/generate-screenshot-thumbnails.ts  # Generate gallery thumbnails
```

### 📖 Full Documentation

See [PRISMA_WORKFLOW.md](./PRISMA_WORKFLOW.md) for complete workflow guide, troubleshooting, and recovery procedures.

**Key Points:**
- ✅ Database files are gitignored (not committed)
- ✅ Always backup before risky operations
- ✅ Use migrations for all schema changes
- ✅ Never manually edit the database

### 🚨 CRITICAL: Production Deployments

**When you change `prisma/schema.prisma`, the production database MUST be manually migrated!**

After deploying code with schema changes:

```bash
# In Coolify terminal:
npx prisma db push
```

> **Note:** `pm2 restart all` is not required—the app works immediately after the schema push.

**⚠️ Failure to run `prisma db push` will cause production crashes** with errors like:
```
The column `main.Show.fieldName` does not exist in the current database.
```

**The build process runs `prisma generate` but this ONLY updates TypeScript types, it does NOT migrate the database!**


## Usage

### Creating a Show

1. Navigate to **Shows** → **Create Show**
2. Fill in show details:
   - Title and host name
   - Description
   - Show type (Local/Syndicated Podcast/Music)
   - Start date and time (using popup pickers)
   - Duration
   - Check "Repeats Weekly?" for recurring shows
3. Configure recording:
   - Toggle recording on/off
   - Select recording source (if enabled)
4. Upload cover image
5. Click **Create Show**

### Scheduling Shows

1. Navigate to **Schedule**
2. Click an empty time slot on the calendar
3. In the modal, select an existing show or create a new one
4. Set the duration and choose whether it repeats weekly
5. Click any scheduled event to edit or delete

### Managing Recordings

The recorder service runs in the background and automatically:
- Starts recording when a scheduled show begins
- Stops recording when the show ends
- Saves recordings to the `/recordings` directory
- Tracks recording status in the database

To run the recorder service:
```bash
node recorder-service.ts
```

## Project Structure

```
radio-suite/
├── app/
│   ├── actions.ts              # Server actions for data mutations
│   ├── schedule/               # Schedule page with calendar UI (click-to-schedule)
│   ├── shows/                  # Show management (create, edit, list)
│   ├── episodes/               # Episode management
│   └── api/                    # API routes (RSS feeds, uploads)
├── components/
│   ├── Scheduler.tsx           # Main scheduling component
│   ├── DateTimePicker.tsx      # Popup date/time picker
│   ├── RecordingControls.tsx  # Recording toggle and source selector
│   ├── EditShowModal.tsx       # Scrollable edit modal
│   ├── DeleteConfirmModal.tsx  # Custom delete confirmation
│   └── ImageUpload.tsx         # Image upload component
├── prisma/
│   └── schema.prisma           # Database schema
├── recorder-service.ts         # Background recording service
└── recordings/                 # Recorded audio files
```

## Database Schema

### Show
- Basic info: title, description, type, host, image
- Recording config: recordingEnabled, recordingSource
- Timestamps: createdAt, updatedAt

### ScheduleSlot
- Links to Show
- Time range: startTime, endTime
- Recurring flag: isRecurring
- Optional sourceUrl override

### Recording
- Links to ScheduleSlot
- File path and status
- Time tracking: startTime, endTime

### Episode
- Links to Recording
- Publishing metadata: title, description, episodeNumber, seasonNumber
- Publication date: publishedAt

### ❓ In-App Help System
- **Contextual Help Icons** - `?` icons throughout the app provide instant access to relevant documentation
- **Immersive Help Browser** - Read guides, FAQs, and tutorials without leaving the application
- **Searchable Knowledge Base** - Quickly find answers with real-time search across all help articles

## Development Roadmap

### Completed Recently ✅
- [x] Audio player for recorded files
- [x] Episode Management UI (auto-publishing)
- [x] RSS feed generation and testing
- [x] Schedule overlap prevention
- [x] Calendar visual fixes (event heights)
- [x] Time-slot-specific deletion
- [x] Live streaming configuration and player
- [x] Public listen page with schedule
- [x] Configurable audio encoding quality (codec, bitrate, sample rate)
- [x] Recording quality tracking and badges
- [x] In-app help system with contextual linking
- [x] Import/Export feature for station migration and backups
- [x] Time display accuracy improvements (ceiling rounding, faster polling)
- [x] Automatic image variant generation (card/icon sizes for faster page loads)
- [x] Per-slot recording control with scope selector (single/all future broadcasts)
- [x] Song Recognition via ACRCloud integration (audio fingerprinting, cover art, metadata display)
- [x] Automatic bitrate detection for ACRCloud (stream-specific optimization)

### Next Up
- [ ] Enhanced public-facing pages (show details, host bios)
- [ ] Recording dashboard with status monitoring
- [ ] Batch episode editing
- [ ] Per-show encoding overrides
- [ ] Recording pre/post-roll buffers

### Future Enhancements
- [x] WebSocket foundation + Stream Health alerts (Socket.IO, Live indicator on Streams page)
- [ ] Enhance recorder service with error recovery and retry logic
- [ ] Analytics and reporting
- [ ] Multi-user support with authentication
- [ ] Cloud storage integration for recordings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

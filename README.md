# Radio Suite 📻

**A modern, all-in-one radio station management system.**

Radio Suite combines a powerful **admin dashboard** for scheduling and automation with a beautiful **public-facing listener site**. It handles everything from planning your weekly grid to recording live broadcasts and automatically publishing them as podcasts.

### Key Capabilities:
- **Public Listener Experience**: A stunning, animated public schedule with a persistent live audio player and "Now Playing" metadata.
- **Advanced Scheduling**: Visual drag-and-drop calendar with conflict detection, recurring show automation, and timezone awareness.
- **Automated Recording**: Background service that records shows from Icecast streams, with smart transcoding and configurable quality (MP3/AAC/FLAC).
- **Podcast Publishing**: Turn recordings into podcast episodes with one click, complete with iTunes-compatible RSS feeds.
- **Station Management**: comprehensive settings for station identity, stream monitoring, and audio encoding preferences.

## Features

- **Show management** – Create and manage shows with rich metadata (host, artwork, type, tags, explicit flag, recording config).
- **Visual schedule** – Calendar-based week/day views with recurring slots, conflict prevention, tooltips, and edit modals.
- **Station-wide timezone** – Single global station timezone configurable in Settings; schedule views, the live clock, and the recorder service all use station time, independent of user or server location.
- Automated recording – Per-show recording toggles, Icecast stream source selection, background recorder service, and status tracking.
  - **Smart transcoding**: automatically detects stream format (e.g., AAC) and transcodes to MP3 when needed, otherwise copies the stream directly.
- **Auto-extending recurring shows** – Weekly shows are generated roughly a year ahead and automatically extended in the background so long-running programs keep their slots without manual upkeep.
- **Recordings & episodes** – Turn live recordings into podcast episodes with post-recording episode metadata editing (titles, descriptions, explicit flag, etc.).
- **Audio playback & editing** – Scrub-enabled audio player across the app plus an in-browser waveform editor to trim, fade, and normalize recordings before publishing.
- **Podcast feeds** – Global RSS feed and per-show iTunes-compatible RSS feeds that automatically reflect show/episode edits, with in-app copy/open UI.
- **Stream monitoring** – Icecast streams dashboard with health checks, status badges, bitrate/listener stats, and error diagnostics.
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
- **Recurring shows** – Automatically generate weekly slots ~1 year ahead (52 weeks) with background auto-extension so successful shows can run for years.
- Week and day views
- Visual indicators for recurring shows
- Click events to create and edit shows directly from the calendar
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
- **Automatic recurring extension** – Background job extends recurring shows as they approach the end of their scheduled horizon so long-running series never silently fall off the calendar.
- **Smart transcoding**: Automatically detects stream format and transcodes when needed
- **Configurable quality**: Control encoding settings from Settings page

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
- Waveform-based audio editor for recordings
- Trim selected regions with non-destructive backups
- Apply fade-in/fade-out and normalize audio levels
- Zoomable timeline and keyboard shortcuts for efficient editing
- Integrated into the episode editing workflow

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
- **Beautiful modal UI** for feed URLs with one-click copy
- iTunes-compatible podcast metadata
- Automatic episode metadata from show info
- Publishing controls and metadata editing

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

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Calendar:** react-big-calendar
- **Date/Time:** react-datepicker with custom dark theme
- **Backend:** Next.js Server Actions
- **Database:** SQLite + Prisma ORM
- **Recording:** FFmpeg (fluent-ffmpeg)
- **Icons:** lucide-react

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- FFmpeg (for recording functionality)

### Installation

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
```

### 📖 Full Documentation

See [PRISMA_WORKFLOW.md](./PRISMA_WORKFLOW.md) for complete workflow guide, troubleshooting, and recovery procedures.

**Key Points:**
- ✅ Database files are gitignored (not committed)
- ✅ Always backup before risky operations
- ✅ Use migrations for all schema changes
- ✅ Never manually edit the database

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

### Next Up
- [ ] Enhanced public-facing pages (show details, host bios)
- [ ] Recording dashboard with status monitoring
- [ ] Batch episode editing
- [ ] Per-show encoding overrides
- [ ] Recording pre/post-roll buffers

### Future Enhancements
- [ ] Enhance recorder service with error recovery and retry logic
- [ ] Add audio player for recorded files
- [ ] Analytics and reporting
- [ ] Multi-user support with authentication
- [ ] Cloud storage integration for recordings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

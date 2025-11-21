# Radio Suite 📻

A comprehensive radio station management system for scheduling shows, automated recording, and podcast distribution.

## Features

### 🎙️ Show Management
- Create and manage radio shows with rich metadata
- Host information tracking
- Show type categorization (Local/Syndicated Podcast/Music)
- Cover image support
- Custom descriptions

### 📅 Advanced Scheduling
- **Drag-and-drop scheduler** with visual calendar interface
- **Recurring shows** - Automatically generate weekly slots
- Week and day views
- Visual indicators for recurring shows
- Click events to edit shows directly from calendar

### 🎬 Automated Recording
- **Toggle recording** on/off per show
- **Recording source selection** via dropdown
- Automatic recording when shows are scheduled
- Background recording service monitors schedule
- Recording status tracking (PENDING/RECORDING/COMPLETED/FAILED)

### 🎨 Modern UI/UX
- **Full-screen create form** with grid layout (no scrolling needed)
- **Popup date/time pickers** with dark theme
- **Custom delete confirmation modals** (no browser defaults)
- **Scrollable edit modals** when clicking calendar events
- Responsive design with dark theme
- Smooth animations and transitions

### 📡 Podcast Distribution
- RSS feed generation per show
- Episode management
- Metadata editing
- Publishing controls

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Calendar:** react-big-calendar, react-dnd (drag-and-drop)
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
2. Drag a show from the sidebar onto the calendar
3. Choose the time slot
4. Confirm if it should be recurring weekly
5. Click on any scheduled event to edit

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
│   ├── schedule/               # Schedule page with drag-and-drop calendar
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

## Recent Updates

### Phase 3: Icecast Stream Integration & Recorder Verification
- ✅ Stream management UI (add, edit, delete, test)
- ✅ Automatic stream testing and metadata extraction
- ✅ Integration with show recording source selection  
- ✅ Recorder service verified working with Icecast streams
- ✅ URL validation and trimming to prevent connectivity issues

### Phase 2: Full-Screen Layout & Recording Controls
- ✅ Full-screen grid layout for create show form
- ✅ Recording on/off toggle switch
- ✅ Recording source dropdown populated with real streams
- ✅ Better space utilization with two-column layout
- ✅ Database schema updated with recording fields

### Phase 1: Enhanced Forms & Scheduling
- ✅ Modern popup date/time pickers
- ✅ Host field added to shows
- ✅ Custom delete confirmation modals
- ✅ Scrollable edit modal from calendar clicks
- ✅ Recurring show support with visual indicators

## Development Roadmap

### Next Up
- [ ] Episode Management UI (view recordings, publish as episodes)
- [ ] RSS feed testing and validation
- [ ] Public-facing pages for listeners
- [ ] Recording dashboard with status monitoring

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

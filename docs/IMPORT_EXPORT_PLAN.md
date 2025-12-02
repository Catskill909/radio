# Import/Export Feature Plan

## Goal
Allow users to export their Shows and Schedule data (including images) from one instance and import it into another, or use it for backup/migration.

## Strategy: ZIP Archive
Since shows have associated images (covers), a simple JSON export isn't enough. We will use a **ZIP archive** format.

### Archive Structure
```
radio-suite-export-2025-12-01.zip
├── data.json       # The database records
└── images/         # The actual image files
    ├── 1764631146150-face.png
    └── 1764631557632-beat.png
```

### `data.json` Structure
```json
{
  "version": 1,
  "exportedAt": "2025-12-01T18:00:00.000Z",
  "shows": [
    {
      "id": "uuid...",
      "title": "My Show",
      "image": "/uploads/1764631146150-face.png",
      "scheduleSlots": [
        {
          "startTime": "...",
          "endTime": "...",
          "isRecurring": true
        }
      ]
    }
  ]
}
```

## Implementation Details

### 1. Export Workflow (Server Action)
1.  Fetch all `Show` records with their `ScheduleSlot`s.
2.  Create a JSZip instance.
3.  Add `data.json`.
4.  For each show with an `image`:
    -   Read the file from `process.cwd() + '/uploads/' + filename`.
    -   Add it to the `images/` folder in the ZIP.
5.  Return the ZIP stream to the client for download.

### 2. Import Workflow (Server Action)
1.  Receive ZIP file upload.
2.  Extract `data.json`.
3.  **Conflict Resolution:**
    -   **Shows:** Match by `id`. If exists, update? Or skip? (User preference or default to "Update").
    -   **Images:** Extract images from ZIP to `process.cwd() + '/uploads/'`.
4.  **Database Operations:**
    -   Upsert Shows.
    -   Re-create ScheduleSlots (Careful: avoid duplicates. Maybe delete existing slots for imported shows first?).

### 3. UI Changes
-   **Page:** `app/settings/page.tsx` (or a new tab).
-   **Section:** "Data Management".
-   **Buttons:**
    -   "Export Data" (Download)
    -   "Import Data" (File Input + Confirmation Modal).

## Technical Dependencies
-   `jszip`: For creating/reading ZIP files.
-   `fs`: For file system operations.

## Risks & Considerations
-   **Large Archives:** If there are many images, the export might be slow or memory-intensive. Stream processing is preferred.
-   **ID Conflicts:** If importing into a DB that already has data, UUID collisions are rare but logical duplicates (same show title) might occur.
-   **Image Paths:** Ensure the import logic correctly maps the image paths in the DB to the restored files.

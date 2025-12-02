# Import/Export Feature Plan

## Goal
Enable full migration of Shows and Schedules between environments (e.g., Local -> Production, or Staging -> Production).

## Strategy: ZIP Archive & "Replace All"
To ensure a clean state and avoid complex conflict resolution, the import will use a **"Replace All"** strategy.
**Warning:** This will delete ALL existing Shows and Schedule Slots on the target machine before importing.

### Archive Structure
```
radio-suite-export.zip
├── data.json       # The database records
└── images/         # The actual image files
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
      "recordingEnabled": true,
      "recordingSource": null, // EXCLUDED/CLEARED
      "scheduleSlots": [...]
    }
  ]
}
```

## Implementation Details

### 1. Export Workflow (Server Action)
1.  Fetch all `Show` records with `ScheduleSlot`s.
2.  **Sanitize Data:** Set `recordingSource` to `null` for all shows (as streams are site-specific).
3.  Create ZIP with `data.json` and referenced images.
4.  Stream to client.

### 2. Import Workflow (Server Action)
1.  **Backup (Optional but recommended):** (Maybe later).
2.  **Wipe Existing Data:**
    -   `DELETE FROM ScheduleSlot;`
    -   `DELETE FROM Show;`
3.  **Process ZIP:**
    -   Extract images to `/app/uploads`.
    -   Read `data.json`.
4.  **Restore Data:**
    -   Create `Show` records.
    -   Create `ScheduleSlot` records.

### 3. UI Changes
-   **Settings Page:** New "Data Management" card.
-   **Export Button:** "Export All Data".
-   **Import Button:** "Import Data (Replace All)".
    -   **Critical Warning Modal:** "This will delete all existing shows and schedule slots. Are you sure?"

## Technical Dependencies
-   `jszip`: `npm install jszip`
-   `fs/promises`: Standard node lib.

## Safety Checks
-   Ensure we don't delete `StationSettings` or `IcecastStream` configs (only Shows/Schedule).
-   Validate ZIP structure before wiping data.

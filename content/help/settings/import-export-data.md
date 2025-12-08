# Import/Export Data

The Import/Export feature allows you to migrate your entire station configuration between environments or create backups of your show data.

## What Gets Exported

When you export your data, the system creates a **ZIP archive** containing:

- **All Shows**: Complete metadata including titles, descriptions, artwork, hosts, and settings
- **Schedule Slots**: All scheduled time slots (recurring and one-time)
- **Show Images**: All uploaded cover artwork files

### What's NOT Included

- **Recording Source** settings are automatically cleared (streams are site-specific)
- **Station Settings** (timezone, identity) are not included
- **Recorded Audio Files** and **Published Episodes** are not included

## Exporting Data

1. Navigate to **Settings**
2. Scroll to the **Data Management** section
3. Click **Export All Data**
4. A ZIP file will download to your computer (e.g., `radio-suite-export-2025-12-01.zip`)

The file name includes the export date for easy identification.

## Importing Data

> [!WARNING]
> **This is a "Replace All" operation!** Importing data will **permanently delete** all existing Shows and Schedule Slots on the target station. Station settings and streams will not be affected.

### Import Steps

1. Navigate to **Settings** on the **target** station
2. Scroll to **Data Management**
3. Click **Import Data (Replace All)**
4. Select your exported ZIP file
5. **Read the warning carefully**
6. Click **"Yes, Replace Everything"** to confirm
7. Wait for the import to complete (may take 30-60 seconds for large files)

### Progress Indicator

During import, you'll see:
- "Uploading file..." → "Processing import..." status messages
- A spinner indicating the operation is in progress
- A success message when complete

## Common Use Cases

### 1. Migrating from Local to Production

1. **Local Development**: Export your configured shows and schedule
2. **Production Server**: Import the ZIP to replicate your setup
3. **Configure Streams**: Add your production Icecast streams
4. **Enable Recording**: Set recording sources for each show

### 2. Creating a Backup

Regularly export your data to create backups:
- Weekly exports for active stations
- Before major configuration changes
- Before software updates

### 3. Cloning a Station

Use Import/Export to create a copy of an existing station:
1. Export from the source station
2. Set up a new station instance
3. Import the data
4. Customize branding and settings

## Technical Details

### ZIP Structure

```
radio-suite-export-2025-12-01.zip
├── data.json       # Database records (Shows & Schedules)
└── images/         # Show cover artwork files
    ├── 1764631146150-face.png
    └── 1764631557632-beat.png
```

### File Size Limits

- Maximum import file size: **100MB**
- Typical export sizes:
  - Small station (10 shows): ~5-10 MB
  - Medium station (50 shows): ~20-50 MB
  - Large station (100+ shows): ~50-100 MB

## Troubleshooting

### Import Hangs or Times Out

- Large files may take up to 60 seconds
- Check Coolify logs for progress messages
- Ensure `/app/uploads` volume is mounted in production

### Images Don't Display After Import

1. Verify the `/app/uploads` volume exists in Coolify
2. Check that the volume is mounted at `/app/uploads` (not `/uploads`)
3. Redeploy the application after adding the volume

### "Invalid Archive" Error

- The ZIP file may be corrupted
- Re-export the data and try again
- Ensure you're uploading a StationDock export file (not a random ZIP)

## Related Topics

- [Station Settings](#)
- [Creating Your First Show](#)
- [Deployment Guide](https://github.com/Catskill909/radio/blob/main/docs/DEPLOYMENT_GUIDE.md)

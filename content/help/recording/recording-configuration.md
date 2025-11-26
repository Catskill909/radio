---
title: "Recording Configuration"
category: "Recording & Quality"
order: 1
relatedTopics:
  - "audio-encoding-quality"
  - "adding-icecast-streams"
keywords:
  - "recording"
  - "configuration"
  - "automated recording"
  - "stream source"
---

# Recording Configuration

Set up automated recording for your shows to capture broadcasts and convert them into podcast episodes.

## Enabling Recording

Recording is configured per-show in the show settings:

1. **Edit the Show** - Click a show card or calendar event
2. **Toggle "Enable Recording"** - Turn on automated recording
3. **Select Stream Source** - Choose an Icecast stream
4. **Configure Quality** (optional) - Adjust audio encoding settings

## Selecting a Stream Source

### Prerequisites
You must add Icecast streams before they appear in the dropdown.

**To add a stream:**
1. Navigate to **Streams** page
2. Click **+ Add Stream**
3. Enter stream URL (e.g., `http://icecast.example.com:8000/stream`)
4. Save and test the stream

### Choosing the Right Source
- **Live broadcasts**: Select your main station stream
- **Syndicated content**: Use the source stream URL
- **Studio feeds**: Connect to your studio output

## Audio Encoding Quality

Configure how your recordings are encoded:

### Codec
- **MP3 (libmp3lame)** - Universal compatibility (recommended)
- **AAC** - Better quality at lower bitrates
- **Opus** - Modern, efficient codec

### Bitrate
- **Voice (96-128 kbps)** - Talk shows, interviews
- **Music (192-256 kbps)** - Music programming (recommended)
- **Archival (320 kbps)** - Maximum quality

### Sample Rate
- **44.1 kHz** - CD quality (recommended)
- **48 kHz** - Professional standard
- **Auto** - Match source stream

### VBR vs CBR
- **VBR (Variable Bitrate)** - Better quality, smaller files (recommended)
- **CBR (Constant Bitrate)** - Consistent bitrate, larger files

> **💡 Tip:** Use the quality presets (Voice, Music, Archival) for quick configuration.

## How Recording Works

### Automated Workflow

**Before Show:**
- System checks schedule 30 seconds before start time
- Verifies stream is online and recording is enabled
- Creates recording entry in database with `PENDING` status

**During Show:**
- At start time, recording begins automatically
- Status changes to `RECORDING`
- FFmpeg captures audio from the stream source
- Progress is logged to `recorder-service.log`

**After Show:**
- Recording stops at scheduled end time
- File is finalized and metadata is saved
- Status changes to `COMPLETED`
- Recording auto-publishes as an episode (if configured)

### Smart Transcoding

Radio Suite intelligently handles audio encoding:

**Copy Mode** (Fast, no quality loss)
- If source stream uses MP3 codec
- AND matches your configured settings
- Audio is copied directly (no re-encoding)

**Transcode Mode** (Quality controlled)
- If source uses different codec
- OR different quality settings
- FFmpeg transcodes to your configured format
- Uses your bitrate/sample rate settings

## Viewing Recording Status

### Live Status

During active recordings, the **Recordings** page shows:
- 🔴 Red `RECORDING` badge
- Show name and scheduled time
- File size (updates in real-time)

### Completed Recordings

After shows end:
- ✅ Green `COMPLETED` badge
- Final file size and duration
- **Quality badges** showing codec, bitrate, sample rate

### Failed Recordings

If something goes wrong:
- ❌ Red `FAILED` badge
- Error message explaining the issue
- Option to retry or delete

## Troubleshooting

### "Recording Failed to Start"

**Possible causes:**
- Stream is offline or unreachable
- Incorrect stream URL
- Network connectivity issues

**Solutions:**
- Check stream status on Streams page
- Verify stream URL is correct
- Test stream with manual refresh

### "Recording source required when recording is enabled"

You must select a stream source OR disable recording.

### Recording Has No Audio

**Possible causes:**
- Stream was silent during broadcast
- Wrong stream source selected
- Codec/format incompatibility

**Solutions:**
- Play stream manually to verify audio
- Check that you selected the correct source
- Review `recorder-service.log` for errors

### File Size is Too Large

Reduce file size by:
- Lowering bitrate (192 → 128 kbps)
- Enabling VBR instead of CBR
- Using a more efficient codec (AAC, Opus)

### File Size is Too Small

Increase quality by:
- Raising bitrate (128 → 192 kbps)
- Using higher sample rate (44.1 → 48 kHz)
- Disabling VBR for consistent quality

## Best Practices

### Quality Settings
- **Talk shows**: 96-128 kbps MP3 VBR
- **Music shows**: 192-256 kbps MP3 VBR
- **HD Archive**: 320 kbps MP3 CBR or lossless

### Storage Planning
1-hour show file sizes (approximate):
- 128 kbps = ~58 MB
- 192 kbps = ~86 MB
- 256 kbps = ~115 MB
- 320 kbps = ~144 MB

### Reliability
- Test stream health regularly
- Monitor `recorder-service.log`
- Keep recorder service running via PM2

## Related Topics

- **[Audio Encoding Quality](/help/audio-encoding-quality)** - Deep dive into quality settings
- **[Adding Icecast Streams](/help/adding-icecast-streams)** - Stream management
- **[Publishing Episodes](/help/publishing-episodes)** - Post-recording workflow

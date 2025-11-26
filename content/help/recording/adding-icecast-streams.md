---
title: "Adding Icecast Streams"
category: "Recording & Quality"
order: 2
relatedTopics:
  - "recording-configuration"
  - "stream-health-monitoring"
keywords:
  - "icecast"
  - "stream"
  - "source"
  - "mount point"
---

# Adding Icecast Streams

Connect Radio Suite to your Icecast server to enable automated recording of live broadcasts.

## What is an Icecast Stream?

Icecast is a streaming media server that broadcasts audio over the internet. Radio Suite connects to Icecast streams to:

- **Record live broadcasts** automatically
- **Monitor stream health** in real-time
- **Verify audio quality** before scheduling recordings

## Prerequisites

Before adding a stream, you need:

1. **Icecast Server Running** - Your station's Icecast server must be online
2. **Stream URL** - Complete URL to the mount point
3. **Network Access** - Radio Suite server must reach the Icecast server

## Adding Your First Stream

### Step 1: Navigate to Streams Page

Click **Streams** in the sidebar navigation.

### Step 2: Click Add Stream

Click the **+ Add Stream** button in the top-right corner.

### Step 3: Enter Stream Details

**Stream Name**
- Descriptive name (e.g., "Main Station Feed", "Studio Output")
- Used in recording source dropdowns

**Stream URL**
- Format: `http://server:port/mountpoint`
- Example: `http://icecast.mystation.com:8000/live.mp3`

### Step 4: Test Connection

Click **Test Stream** to verify:
- ✅ Server is reachable
- ✅ Stream is active
- ✅ Audio data is flowing

### Step 5: Save

Click **Add Stream** to save.

The stream appears in your streams list and is now available for recording!

## Stream URL Formats

### Standard HTTP
```
http://icecast.example.com:8000/stream.mp3
```

### HTTPS (Secure)
```
https://icecast.example.com:8443/stream.mp3
```

### With Authentication
If your Icecast server requires authentication, include credentials in the URL:
```
http://username:password@icecast.example.com:8000/stream.mp3
```

> **⚠️ Security Note:** Credentials are stored in the database. Use a dedicated read-only Icecast account for Radio Suite.

## Common Stream Types

### Main Broadcast
- **Purpose**: Primary station output
- **Use for**: Recording all shows from main feed
- **Quality**: Highest available (256+ kbps recommended)

### Studio Feed
- **Purpose**: Direct studio output
- **Use for**: Recording before processing/compression
- **Quality**: Uncompressed or lossless

### Syndicated Source
- **Purpose**: External content providers
- **Use for**: Recording syndicated shows
- **Quality**: As provided by source

## Stream Health Monitoring

Radio Suite automatically monitors stream health:

**Status Indicators:**
- 🟢 **Online** - Stream active, audio flowing
- 🔴 **Offline** - Stream unreachable or stopped
- 🟡 **Warning** - Intermittent connection issues

**Health Checks:**
- Performed every 60 seconds
- Verifies HTTP connection
- Checks for audio data

## Managing Streams

### Editing Streams

1. Click the **Edit** button on a stream card
2. Modify stream name or URL
3. Click **Save Changes**

> **📖 Note:** Changing the URL requires re-testing the connection.

### Deleting Streams

1. Click the **Delete** button on a stream card
2. Confirm deletion

> **⚠️ Warning:** You cannot delete streams that are currently assigned to shows with recording enabled!

## Troubleshooting

### "Stream is offline"

**Possible Causes:**
- Icecast server is down
- Incorrect URL or port
- Firewall blocking connection
- Mount point doesn't exist

**Solutions:**
1. Verify Icecast server is running
2. Check URL format (include `http://`)
3. Test URL in browser or media player
4. Verify port is accessible (8000 is common)

### "Connection timed out"

**Possible Causes:**
- Network connectivity issues
- Icecast server not responding
- Firewall blocking Radio Suite server

**Solutions:**
1. Ping Icecast server from Radio Suite server
2. Check Icecast server logs
3. Verify no firewalls blocking outbound connections

### "Stream URL is invalid"

**Possible Causes:**
- Missing `http://` or `https://`
- Incorrect port number
- Special characters not URL-encoded

**Solutions:**
1. Ensure URL starts with `http://` or `https://`
2. Verify port number is correct
3. URL-encode special characters in passwords

### "Authentication failed"

**Possible Causes:**
- Incorrect username/password
- Special characters in credentials
- Icecast auth not configured

**Solutions:**
1. Verify credentials are correct
2. URL-encode special characters
3. Check Icecast access controls

## Best Practices

### URL Organization
- Use descriptive stream names
- Group streams by purpose (main, backup, studio)
- Document stream purposes in name

### Security
- Use HTTPS when available
- Create dedicated Icecast accounts
- Limit permissions to read-only
- Rotate credentials periodically

### Reliability
- Add backup stream sources
- Monitor stream health regularly
- Test streams before scheduling recordings

### Quality
- Use highest available bitrate for archival
- Match stream quality to final output needs
- Consider bandwidth when recording multiple streams

## Multiple Stream Workflow

If you have multiple Icecast sources:

**Strategy 1: Primary + Backup**
- Add main stream as "Primary Feed"
- Add backup stream as "Backup Feed"
- Switch recording source if primary fails

**Strategy 2: Different Content**
- Main Studio: "Live Broadcast"
- Production Room: "Pre-Recorded Shows"
- Syndication: "External Feed"

**Strategy 3: Quality Tiers**
- High Quality: "Archive Feed" (320 kbps)
- Medium Quality: "Podcast Feed" (192 kbps)
- Low Quality: "Preview Feed" (96 kbps)

## Related Topics

- **[Recording Configuration](/help/recording-configuration)** - Configure show recordings
- **[Stream Health Monitoring](/help/stream-health-monitoring)** - Monitor stream status
- **[Audio Encoding Quality](/help/audio-encoding-quality)** - Optimize recording quality

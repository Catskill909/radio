---
title: Song Recognition (ACRCloud)
description: Automatically identify songs playing on your stream using ACRCloud's audio fingerprinting technology.
category: Settings
---

# Song Recognition

StationDock can automatically identify songs playing on your stream using ACRCloud's audio fingerprinting technology. This feature works by capturing a short audio sample from your stream and matching it against ACRCloud's music database.

## Getting Started

### 1. Create an ACRCloud Account

1. Go to [console.acrcloud.com](https://console.acrcloud.com/)
2. Sign up for a free account
3. Create a new **Audio & Video Recognition** project

### 2. Get Your API Credentials

After creating a project, you'll receive:

- **Host**: The API endpoint (e.g., `identify-us-west-2.acrcloud.com`)
- **Access Key**: Your project's public key
- **Access Secret**: Your project's private key

> **Tip**: Choose the host region closest to your server for faster identification.

### 3. Configure in StationDock

1. Go to **Settings** → **Song Recognition**
2. Enable the toggle
3. Select your host region from the dropdown
4. Enter your Access Key and Access Secret
5. Click **Save Settings**

## Testing Song Recognition

1. Select a stream from your configured streams
2. Click **Play** to preview the audio
3. Click **Identify Song** to test recognition
4. If a song is found, you'll see the cover art, title, artist, and album

> **Note**: Recognition works best with commercial music. Talk shows or uncommon recordings may not be identified.

## Production Deployment (Coolify)

For production, it's recommended to use environment variables instead of database storage for credentials. Add these to your Coolify environment:

```env
ACRCLOUD_HOST=identify-us-west-2.acrcloud.com
ACRCLOUD_ACCESS_KEY=your_access_key
ACRCLOUD_ACCESS_SECRET=your_access_secret
```

When environment variables are set, they take precedence over database values. The Settings page will show a notice indicating production mode is active.

## Troubleshooting

### "Song not found in database"

This means ACRCloud couldn't match the audio fingerprint. Try:
- Waiting for a different song to play
- Ensuring music is actually playing (not talk/silence)
- Checking that your ACRCloud project has access to commercial music databases

### "ACRCloud credentials not configured"

Make sure you've:
1. Entered all three credentials (Host, Access Key, Access Secret)
2. Clicked Save Settings
3. Enabled the Song Recognition toggle

### "Failed to play stream"

The stream URL may be invalid or the stream is offline. Check:
- The stream is enabled in your Streams configuration
- The stream URL is accessible

## API Limits

ACRCloud free tier includes limited monthly requests. Check your usage at [console.acrcloud.com](https://console.acrcloud.com/) and upgrade if needed for high-volume usage.

## Future Features

- Display "Now Playing" on the public `/listen` page
- Song history logging
- Real-time identification updates via WebSocket

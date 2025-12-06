---
title: Station Audio Stream
category: settings
---

# Station Audio Stream

Select which Icecast stream plays on your public listen page.

## How It Works

1. **Add streams** in the Streams section of the admin dashboard
2. **Select your primary stream** here in Settings
3. **Listeners hear** the selected stream on the `/listen` page

## Selecting a Stream

The dropdown shows all enabled streams from your Streams dashboard. Only streams marked as "enabled" appear in this list.

If you don't see any streams:
1. Go to **Streams** in the sidebar
2. Add a new stream with your Icecast URL
3. Make sure the stream is enabled
4. Return here and select it

## Stream Health

The selected stream is automatically monitored for:
- Online/offline status
- Bitrate and format
- Current listener count

If the stream goes offline, listeners will see appropriate error messaging rather than a broken player.

## Multiple Streams

While you can add many streams to StationDock for recording purposes, only **one stream** can be the active listen page stream at a time. Choose your primary broadcast stream here.

## Tips

- Test your stream URL before setting it as the active stream
- Monitor stream health on the Stats page
- Consider having a backup stream URL ready in case of outages

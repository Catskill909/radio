---
title: Stream Health Monitoring
description: Learn how to monitor your Icecast streams and troubleshoot connection issues.
category: Recording & Quality
icon: fa-solid fa-heart-pulse
related: ["adding-icecast-streams", "recording-configuration"]
---

# Stream Health Monitoring

Radio Suite provides real-time health monitoring for all your configured Icecast streams. This ensures you always know if your audio sources are online and ready for recording or broadcasting.

## Status Indicators

On the **Streams** page, each stream card displays a live status badge:

- **<span style="color: #4ade80">●</span> Online:** The stream is active, reachable, and receiving audio data.
- **<span style="color: #f87171">●</span> Offline:** The stream cannot be reached. This usually means the source encoder is disconnected.
- **<span style="color: #fbbf24">●</span> Testing:** The system is currently verifying the connection.
- **<span style="color: #9ca3af">●</span> Disabled:** The stream monitoring is turned off in Radio Suite.

## Health Checks

The system performs health checks in two ways:
1.  **Automatic:** Every 30 seconds, the background service pings your Icecast server to verify the stream status.
2.  **Manual:** You can click the **Refresh** button on the Streams page to force an immediate check.

## Troubleshooting Connection Issues

If your stream shows as **Offline** unexpectedly:

1.  **Check the Source Encoder:** Ensure your DJ software (e.g., BUTT, Mixxx, VirtualDJ) is actually broadcasting.
2.  **Verify Credentials:** Double-check the mount point, password, and port in your encoder settings match your Icecast server.
3.  **Check Firewall/Network:** Ensure your Radio Suite server can reach the Icecast server.
4.  **Inspect the URL:** Click "Edit" on the stream card to verify the Stream URL is correct (e.g., `http://stream.example.com:8000/live`).

> [!TIP]
> If a stream goes offline during a scheduled recording, Radio Suite will attempt to reconnect, but the recording may contain silence or be split into multiple files.

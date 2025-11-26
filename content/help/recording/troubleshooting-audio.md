---
title: Troubleshooting Audio
description: Solutions for common audio playback and recording issues.
category: Recording & Quality
icon: fa-solid fa-screwdriver-wrench
related: ["stream-health-monitoring", "audio-encoding-quality"]
---

# Troubleshooting Audio

If you are experiencing issues with audio playback or recording, check these common solutions.

## Playback Issues

### "The player just spins and never plays"
- **Cause:** The browser cannot connect to the audio stream.
- **Fix:**
    1. Check if the stream is **Online** in the **Streams** dashboard.
    2. Ensure your browser is not blocking "Mixed Content" if your site is HTTPS but your stream is HTTP.
    3. Try opening the stream URL directly in a new tab to verify it works.

### "I hear silence even though it says playing"
- **Cause:** The player is connected, but the source is sending silence.
- **Fix:** Check your source encoder (DJ software). Ensure the master volume is up and audio is actually being sent to the encoder.

## Recording Issues

### "Recordings are shorter than scheduled"
- **Cause:** The stream went offline during the show.
- **Fix:** Check your internet connection stability at the source. Radio Suite stops recording if the stream drops for an extended period.

### "Audio quality sounds poor or 'underwater'"
- **Cause:** Low bitrate or mismatched sample rates.
- **Fix:**
    1. Go to **Settings > Audio Encoding Quality**.
    2. Ensure your bitrate is at least **128 kbps** (192 kbps recommended for music).
    3. Check that your source encoder matches these settings.

### "Recordings have skips or glitches"
- **Cause:** CPU overload or network packet loss.
- **Fix:** Ensure the server running Radio Suite has sufficient CPU resources. Transcoding (e.g., converting FLAC to MP3 on the fly) can be CPU intensive.

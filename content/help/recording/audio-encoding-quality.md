---
title: Audio Encoding Quality Guide
description: Understand audio codecs, bitrates, and quality settings for your recordings.
category: Recording & Quality
icon: fa-solid fa-sliders
related: ["recording-configuration", "adding-icecast-streams"]
---

# Audio Encoding Quality Guide

Radio Suite offers flexible audio encoding options to balance sound quality with file size. This guide explains the available settings and helps you choose the right configuration for your station.

## Available Codecs

We support four industry-standard audio codecs:

### 1. MP3 (libmp3lame)
- **Best for:** Universal compatibility.
- **Pros:** Plays on virtually any device or browser.
- **Cons:** Lower quality per bitrate compared to newer codecs.
- **Recommendation:** Use for podcasts and public downloads where compatibility is key.

### 2. AAC (Advanced Audio Coding)
- **Best for:** High quality at lower bitrates.
- **Pros:** Standard for web streaming and mobile devices. Better quality than MP3 at the same bitrate.
- **Cons:** Slightly less universal than MP3 (though widely supported).
- **Recommendation:** Excellent all-rounder for music and speech.

### 3. Opus (libopus)
- **Best for:** Maximum efficiency and quality.
- **Pros:** Superior quality at low bitrates. Extremely low latency.
- **Cons:** Less support in older media players.
- **Recommendation:** Ideal for internal archiving or modern web playback.

### 4. FLAC (Free Lossless Audio Codec)
- **Best for:** Archival and audiophile quality.
- **Pros:** Lossless compression (perfect copy of the source).
- **Cons:** Large file sizes.
- **Recommendation:** Use for master archives where storage space is not a concern.

## Bitrate Settings

Bitrate determines the amount of data used to represent one second of audio. Higher bitrates generally mean better quality but larger files.

| Bitrate | Quality Level | Best Use Case |
| :--- | :--- | :--- |
| **64-96 kbps** | Voice Quality | Talk radio, speech-only podcasts. |
| **128 kbps** | Standard Quality | Decent for music, standard for most podcasts. |
| **192 kbps** | High Quality | Good for music with complex instrumentation. |
| **256-320 kbps** | CD Quality | Near-transparent quality for music. |

## Variable Bitrate (VBR)

**VBR (Variable Bitrate)** allows the encoder to adjust the bitrate dynamically based on the complexity of the audio.
- **Enabled (Default):** Saves space during silence or simple passages, uses more data for complex parts.
- **Disabled (CBR):** Maintains a constant bitrate. Easier for streaming but less efficient.

## Configuring Station Defaults

You can set the default encoding quality for all new shows in **Settings > Audio Encoding**.

1.  Navigate to `/settings`.
2.  Scroll to the **Audio Encoding Quality** section.
3.  Select your preferred **Codec**, **Bitrate**, and **Sample Rate**.
4.  Toggle **VBR** on or off.
5.  Click **Save Changes**.

> [!TIP]
> Changing the station default will not affect existing recordings, but will apply to all future recordings unless overridden by specific show settings (coming soon).

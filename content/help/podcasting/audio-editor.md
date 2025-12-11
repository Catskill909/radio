---
title: Audio Editor
description: Trim, cut, fade, and normalize your recordings with the in-browser waveform editor.
category: Podcasting
icon: fa-solid fa-waveform
related: ["editing-episodes", "publishing-episodes"]
---

# Audio Editor

The Audio Editor lets you make precise edits to your recordings directly in the browser—no external software needed.

## Opening the Editor

1. Navigate to the **Episodes** page.
2. Click **Manage Episodes** on the show card.
3. Find an episode and click the **Edit** (pencil) icon.
4. In the Edit Episode modal, click the **Edit Audio** button.

## Understanding the Interface

When the editor opens, you'll see:

- **Minimap**: A small overview bar at the top showing the entire recording. Click anywhere to jump to that position.
- **Main Waveform**: The detailed view of your audio. Click and drag to create a selection.
- **Timeline**: Time markers below the waveform.
- **Zoom Controls**: +/- buttons and a "fit to view" button to navigate longer recordings.
- **Playback Controls**: Play, pause, and loop your audio or selection.

## Basic Playback

| Action | How |
|--------|-----|
| Play/Pause | Click **Play** button or press **Space** |
| Seek | Click anywhere on the waveform |
| Seek 5 seconds | **Left/Right Arrow** keys |

## Making Selections

Click and drag on the waveform to select a region. Selected audio appears highlighted in green.

When you have a selection, additional controls appear:

- **Play Selection**: Plays only the selected portion
- **Loop**: Continuously loops the selection
- **Clear**: Removes the selection

## Editing Operations

### Crop (Keep Selection)

Removes everything **outside** your selection, keeping only the selected portion.

**Use case**: Trimming silence from the start and end of a recording.

### Cut (Delete Selection)

Removes the selected portion and joins the audio before and after.

**Use case**: Removing a mistake, cough, or unwanted segment.

### Fade In / Fade Out

Applies a gradual volume change at a specific position:

1. Make a selection where you want the fade to start (for fade in) or end (for fade out).
2. Set the **fade duration** using the number input (1-60 seconds).
3. Click **In** to apply fade-in at the selection start, or **Out** to apply fade-out at the selection end.

**Use case**: Smooth intro/outro transitions, music fades.

### Normalize

Adjusts the audio volume to standard podcast levels (-16 LUFS):

- **With a selection**: Normalizes only the selected portion.
- **Without a selection**: Normalizes the entire file.

**Use case**: Ensuring consistent volume throughout an episode.

## Processing Large Files

> [!NOTE]
> Large audio files (30+ minutes) may take a minute or more to process. The editor will display a status message while working.

## Backups

Every edit operation creates a backup of your original file. Backups are stored in the recordings folder and automatically cleaned up after 7 days.

## Keyboard Shortcuts

Press **?** in the editor to see all available shortcuts:

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← / → | Seek 5 seconds |
| L | Toggle loop |
| Esc | Clear selection |
| ? | Show shortcuts |

## Tips for Best Results

1. **Listen before editing**: Always preview your selection before applying edits.
2. **Use the minimap**: For long recordings, the minimap helps you navigate quickly.
3. **Check fade duration**: Match your fade duration to your music or transition.
4. **Normalize last**: Apply normalization as your final step after all other edits.

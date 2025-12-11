# DEEP AUDIT LOG: Audio Player Time Display Bug

## Problem Description
- **Symptoms**: Time numbers (`--:--`) are missing on Hard Refresh. They appear on Client-side Navigation.
- **Current State**: 
    - API refactored to Streams (Server is stable).
    - **User Report**: "NOTING IN THE CONSOLE. SAME ISSUE."

## Hypotheses & Status

| ID | Hypothesis | Status | Notes |
|----|------------|--------|-------|
| H1 | Race Condition (Event missed) | **Confirmed** | Event is missed on hard refresh. |
| H2 | Browser Throttling (readyState=0) | **Disproven** | Logs showed `readyState: 4` (HAVE_ENOUGH_DATA). |
| H3 | `readyState` is >=1 but UI doesn't update | **CONFIRMED** | Logs showed `POLL readyState: 4` but screenshot showed `--:--`. |
| H4 | Component Remounting | **Irrelevant** | |
| H5 | Library Internal State | **CONFIRMED** | `react-h5-audio-player` ignores `forceUpdate` if it missed the initial event. It caches the duration internally. |

## Findings
1.  **The Browser IS Loading**: The logs proved `readyState` reached 4.
2.  **The Library IS Stubborn**: Calling `forceUpdate` re-rendered the parent, but the library component did NOT update its internal duration state. It seems to only read duration on mount or on specific events.

## The Solution: Key Remount Strategy
Since we cannot force the library to update its internal state via props or methods, we must **destroy and recreate it**.
- We use a `key` prop that changes when metadata is detected (`src` -> `src_loaded_TIMESTAMP`).
- This forces React to unmount the "stale" player (which thinks duration is 0) and mount a "fresh" player.
- The fresh player mounts, sees `audio.readyState` is 4, and initializes correctly.

## Verification
- Implemented `setPlayerKey` in `AudioPlayer.tsx`.
- Waiting for user confirmation.

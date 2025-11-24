# Time Display Bug Audit

## Symptoms
- **Hard Refresh**: Time numbers show `--:--` (FAIL).
- **Navigation (Client-side)**: Time numbers show `00:00 / 04:54` (SUCCESS).
- **Safari vs Chrome**: Inconsistent behavior, sometimes site hangs (likely fixed by API stream refactor, but race condition persists).

## Root Cause Analysis
This is a classic **Race Condition** between the Browser's native `<audio>` element and the React Component lifecycle.

1.  **Hard Refresh**: The browser parses the HTML and starts loading the audio file immediately (due to `preload="auto"`). The `loadedmetadata` event fires very quickly, often **before** React has finished hydrating and attaching the `onLoadedMetaData` event listener.
    - Result: The event fires into the void. React never hears it. State remains default.

2.  **Navigation**: React mounts the component first. Then the `src` is set or the element is created. The browser starts loading. The event fires **after** the listener is attached.
    - Result: React hears the event. State updates.

## The Solution
We cannot rely solely on the `onLoadedMetaData` event listener because we might miss the event.

We must implement a **"Check on Mount"** strategy:
1.  Use `useEffect` to run code immediately after the component mounts.
2.  Access the underlying `<audio>` element via `ref`.
3.  Check `audio.readyState`.
    - If `readyState >= 1` (HAVE_METADATA), we **manually trigger** the update immediately, because we already missed the event.
    - If `readyState < 1`, we do nothing and wait for the event listener (which is already attached) to fire.

## Implementation Plan
Modify `components/AudioPlayer.tsx`:
1.  Keep the `ref` to access the audio element.
2.  Add a `useEffect` hook.
3.  Inside `useEffect`, check `playerRef.current.audio.current.readyState`.
4.  If loaded, call `forceUpdate()`.

This ensures that whether the metadata loads *before* or *after* mount, we catch it.

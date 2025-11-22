# Audio Scrubber Debug Log

## Problem Statement
Audio scrubbers (seek bars) are NOT working in our Radio Suite app. Clicking on the progress bar does NOT seek the audio. This is a BASIC feature that works in millions of audio players.

## Date: November 22, 2025

---

## Attempts Made (ALL FAILED)

### Attempt 1: Fixed Range Input Styling
- **What we tried**: Added `appearance-none`, increased height, added webkit styles
- **Result**: FAILED - Still no seeking
- **File**: `components/AudioPlayer.tsx` lines 126-146

### Attempt 2: Mouse Event Handlers on Div
- **What we tried**: Replaced range input with direct mouse event handling
- **Implementation**: 
  - `onClick` handler
  - `onMouseDown`, `onMouseMove`, `onMouseUp` for dragging
  - `getBoundingClientRect()` for position calculation
- **Result**: FAILED - Still no seeking
- **File**: `components/AudioPlayer.tsx` lines 64-99, 157-175

---

## Current Implementation Analysis

### Audio Element
```tsx
<audio ref={audioRef} src={src} preload="metadata" />
```
- Located at line 130
- Using ref to control playback
- Source: `/api/audio/[filename]`

### Progress Bar Structure
```tsx
<div 
    ref={progressBarRef}
    className="relative flex-1 h-6 flex items-center group/slider cursor-pointer"
    onClick={handleProgressBarClick}
    onMouseDown={handleProgressBarMouseDown}
    onMouseMove={handleProgressBarMouseMove}
    onMouseUp={handleProgressBarMouseUp}
>
```

### Seek Logic
```tsx
const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !duration) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
}
```

---

## Questions to Investigate

### 1. Is the audio element loading properly?
- [ ] Check if `duration` state is being set
- [ ] Check if `loadedmetadata` event is firing
- [ ] Verify audio source URL is valid

### 2. Are the event handlers firing?
- [ ] Add console.logs to `handleProgressBarClick`
- [ ] Check if `onClick` is being triggered
- [ ] Verify `progressBarRef.current` exists

### 3. Is the audio seekable?
- [ ] Check if audio has `seekable` property
- [ ] Verify server supports byte-range requests (206 Partial Content)
- [ ] Check if audio is fully loaded vs streaming

### 4. Are there React/Next.js specific issues?
- [ ] Client component properly marked with 'use client'
- [ ] Refs being set correctly
- [ ] State updates causing re-renders that break functionality

### 5. CSS/Layout Issues?
- [ ] Is something overlaying the progress bar?
- [ ] Z-index conflicts?
- [ ] Pointer events being blocked?

---

## What Works in Standard Audio Players

### Basic HTML5 Audio with Range Input
```html
<audio id="audio" src="audio.mp3"></audio>
<input type="range" id="seek" value="0" max="100">
<script>
  const audio = document.getElementById('audio');
  const seek = document.getElementById('seek');
  
  audio.addEventListener('timeupdate', () => {
    seek.value = (audio.currentTime / audio.duration) * 100;
  });
  
  seek.addEventListener('input', () => {
    audio.currentTime = (seek.value / 100) * audio.duration;
  });
</script>
```

### Why This Works
1. Direct DOM manipulation
2. Simple event listeners
3. No complex state management
4. Range input handles all mouse interactions

---

## Potential Root Causes

### Theory 1: Server-Side Audio Streaming Issue
- **Evidence**: StackOverflow answer mentioned byte-range requests
- **Check**: Does `/api/audio/[filename]` support 206 Partial Content?
- **Test**: Try with a local file vs API route

### Theory 2: React State Management
- **Evidence**: Setting `currentTime` might trigger re-render that resets position
- **Check**: Are we in an infinite loop of state updates?
- **Test**: Add console.logs to track state changes

### Theory 3: Event Handler Not Firing
- **Evidence**: No visible response when clicking
- **Check**: Are events being captured by parent/child elements?
- **Test**: Add console.log to first line of click handler

### Theory 4: Audio Element Not Ready
- **Evidence**: Seeking might fail if metadata not loaded
- **Check**: Is `duration` actually set when we try to seek?
- **Test**: Log duration value in click handler

### Theory 5: Over-Engineering
- **Evidence**: We added drag support, global mouse listeners, seeking state
- **Check**: Does a SIMPLE click-only version work?
- **Test**: Strip down to bare minimum

---

## Next Steps (SYSTEMATIC DEBUGGING)

### ✅ STEP 1: Console Logging Added (CURRENT)

**What we added:**
- ✅ Log when audio element initializes
- ✅ Log when metadata loads (duration)
- ✅ Log every click on progress bar
- ✅ Log all seek calculations (clickX, percentage, newTime)
- ✅ Log when currentTime is set
- ✅ Log actual audio.currentTime after seek

**How to test:**
1. Open browser DevTools Console (F12)
2. Navigate to Podcast Dashboard or Episode Manager
3. Click play on any episode
4. Watch for: `✅ AudioPlayer: Audio element initialized`
5. Watch for: `📊 AudioPlayer: Metadata loaded`
6. Click anywhere on the progress bar
7. Watch for: `🖱️ CLICK on progress bar detected!`
8. Read all the logged values

**What to look for:**
- Does the click event fire? (🖱️ emoji)
- Is duration set? (should be > 0)
- Are refs valid? (not null)
- Does the calculation look correct?
- Does audio.currentTime actually change?

### STEP 2: Analyze Console Output

Based on console logs, we'll know:
- ❓ Is the click handler even firing?
- ❓ Is duration loaded?
- ❓ Are the refs set correctly?
- ❓ Is the math correct?
- ❓ Does setting currentTime work?

### STEP 3: Test with Simplest Possible Implementation
- Remove all drag functionality
- Remove all state except currentTime/duration
- Use native range input first
- If that works, build up from there

### STEP 4: Check Audio API Route
- Verify it returns proper headers
- Check for byte-range support
- Test with direct URL in browser

### STEP 5: Create Isolated Test Component
- New file with ONLY audio player
- No styling, no fancy features
- Just play/pause and seek
- If this works, compare to current implementation

---

## Success Criteria

✅ Click anywhere on progress bar → audio seeks to that position immediately
✅ Drag scrubber → audio follows scrubber position
✅ Time display updates correctly
✅ Works in both Episode Manager drawer and Podcast Dashboard

---

## Notes

- This is a FUNDAMENTAL feature
- It works in YouTube, Spotify, SoundCloud, every audio player
- We are clearly missing something obvious
- Need to debug systematically, not guess and check

# Duration Not Loading - Deep Audit

## Problem Statement
- ✅ Sidebar drawer: Duration shows (e.g., "04:54")
- ❌ Podcast page: Duration shows "--:--" and never loads

## Both Use Same Component
Both locations use `<AudioPlayer>` from `/components/AudioPlayer.tsx`

### Location 1: Podcast Page (BROKEN)
**File**: `/components/PodcastCard.tsx` line 125-128
```tsx
<AudioPlayer
    src={`/api/audio/${show.latestEpisode.recording.filePath}`}
    title={show.latestEpisode.title}
/>
```

### Location 2: Sidebar Drawer (WORKS)
**File**: `/components/EpisodeManagerDrawer.tsx` line 156-159
```tsx
<AudioPlayer
    src={`/api/audio/${episode.recording.filePath}`}
    title={episode.title}
/>
```

**Same props, same component, different behavior!**

---

## Key Difference Found

### Podcast Page
- Player renders IMMEDIATELY on page load
- Multiple players on same page
- All trying to load metadata at once

### Sidebar Drawer
- Player only renders AFTER clicking play button
- Only ONE player at a time
- User interaction triggers it

---

## Investigation Steps

### Step 1: Check if audio files are different
- [ ] Are the file paths the same format?
- [ ] Do both point to `/api/audio/[filename]`?

### Step 2: Check browser network tab
- [ ] Does the audio file request succeed (200/206)?
- [ ] Are there any CORS errors?
- [ ] Is metadata being sent in response?

### Step 3: Check browser console
- [ ] Any JavaScript errors?
- [ ] Any warnings from the audio library?

### Step 4: Check if it's a timing issue
- [ ] Does duration appear after waiting 10+ seconds?
- [ ] Does it work after clicking play?

### Step 5: Check the library documentation
- [ ] Does react-h5-audio-player have known issues with multiple instances?
- [ ] Is there a prop we're missing?

---

## Theories

### Theory 1: Browser Resource Limits
When multiple audio elements load at once, browser may not load metadata for all.

**Test**: Load only ONE podcast on the page, see if duration appears.

### Theory 2: React Hydration Issue
Client/server mismatch causing audio element to not initialize properly.

**Test**: Check if duration appears after client-side navigation vs direct page load.

### Theory 3: Library Bug with Multiple Instances
The library might not handle multiple instances well.

**Test**: Check library GitHub issues for similar problems.

### Theory 4: API Route Issue
Maybe the API route isn't sending proper headers for metadata.

**Test**: Check Response Headers in Network tab for Content-Length, Accept-Ranges.

---

## Next Steps (DO NOT IMPLEMENT YET)

1. Open browser DevTools
2. Go to Network tab
3. Load podcast page
4. Check audio file requests
5. Look for errors or missing headers
6. Document findings here

---

## DO NOT:
- ❌ Make random code changes
- ❌ Touch the scrubber
- ❌ Rewrite the component
- ❌ Add complex logic

## DO:
- ✅ Investigate systematically
- ✅ Document findings
- ✅ Test theories one at a time
- ✅ Make minimal targeted fix once root cause is found

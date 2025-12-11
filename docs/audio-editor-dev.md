# Audio Editor Development Roadmap

This document tracks the current state and future development paths for StationDock's in-browser audio editor.

---

## Current Implementation

### Core Technology
- **WaveSurfer.js v7** - TypeScript-based waveform visualization
- **FFmpeg** (fluent-ffmpeg) - Server-side audio processing
- **Web Audio API** - Browser audio playback

### Current Features ✅

| Feature | Description |
|---------|-------------|
| **Waveform Display** | Full waveform with auto-fit to container |
| **Minimap** | Overview bar for navigation |
| **Timeline** | Time markers below waveform |
| **Hover Plugin** | Shows timestamp on cursor hover |
| **Visual Zoom** | +/- buttons and fit-to-view |
| **Regions** | Click-drag selection with green highlight |
| **Playback** | Play, pause, seek, loop selected region |
| **Crop** | Keep only selected portion |
| **Cut** | Delete selection, join remaining |
| **Fade In/Out** | User-controlled duration (1-60s) |
| **Normalize** | -16 LUFS (selection or whole file) |
| **Keyboard Shortcuts** | Space, arrows, L, Esc, ? |
| **Non-destructive** | Automatic backups before edits |

### Current Plugins Used
```javascript
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline'
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover'
import MinimapPlugin from 'wavesurfer.js/dist/plugins/minimap'
```

---

## WaveSurfer.js Official Plugins (Not Yet Used)

### 🎛️ Envelope Plugin
**Status:** Tested, reverted (not intuitive for file editing)

Provides visual handles for fade curves. More suited for real-time playback volume control than permanent file edits.

**Potential Use:** Could be adapted for visual fade preview during editing.

### 🎙️ Record Plugin
**Status:** Not implemented

Enables recording from microphone with waveform rendering.

**Potential Use:**
- Record voice intros/outros directly in editor
- Voice annotations for podcast notes
- Quick audio inserts without external software

### 📊 Spectrogram Plugin
**Status:** Not implemented

Displays frequency spectrum visualization.

**Options:**
- `fftSamples` - FFT resolution (default 512)
- `frequencyMin/Max` - Frequency range to display
- `colorMap` - Custom color scheme
- `labels` - Show frequency labels

**Potential Use:**
- Identify noise, hum, or audio issues
- Music vs speech visualization
- Professional audio analysis view
- Toggle between waveform and spectrogram

### 🔊 Zoom Plugin
**Status:** Tested, reverted (scroll-wheel zoom unintuitive)

Provides scroll-wheel zoom functionality.

**Decision:** Replaced with explicit +/- buttons for better UX.

---

## External Libraries for Enhancement

### Tuna.js - Audio Effects
**GitHub:** github.com/Theodeus/tuna

A collection of Web Audio effects that could add professional-grade processing:

| Effect | Use Case |
|--------|----------|
| **Compressor** | Reduce dynamic range, consistent volume |
| **Filter** | EQ adjustments, remove frequencies |
| **Delay** | Echo effects |
| **Convolver** | Reverb (room simulation) |
| **WahWah** | Creative effects |
| **Chorus** | Voice thickening |
| **Bitcrusher** | Lo-fi effects |
| **Gain** | Volume adjustment |

**Integration Approach:**
```javascript
import Tuna from 'tunajs';
const tuna = new Tuna(audioContext);
const compressor = new tuna.Compressor({ /* options */ });
// Connect to audio graph
```

### Tone.js - Advanced Audio Framework
**Site:** tonejs.github.io

Full-featured audio framework for complex audio manipulation:

- **Transport system** for precise timing
- **Built-in effects** (reverb, delay, distortion)
- **Synthesizers** for audio generation
- **Sample-accurate scheduling**

**Potential Use:**
- Advanced audio effects with presets
- Time-stretching (change speed without pitch)
- Audio visualization enhancements

### Howler.js - Audio Playback
**Site:** howlerjs.com

Robust cross-browser audio library with Web Audio fallback.

**Already Covered:** WaveSurfer handles our playback needs; Howler would be redundant.

---

## Future Development Paths

### Path 1: Enhanced Visualization (Low Effort)

**Goal:** Improve understanding of audio content

| Feature | Plugin/Tool | Priority |
|---------|-------------|----------|
| Spectrogram view | WaveSurfer Spectrogram | P2 |
| Toggle waveform/spectrum | Custom toggle | P2 |
| Frequency labels | Spectrogram options | P3 |
| Color theme options | Custom CSS | P3 |

**Implementation Notes:**
- Add spectrogram plugin alongside waveform
- Toggle button to switch views
- Useful for identifying noise issues

---

### Path 2: Audio Effects (Medium Effort)

**Goal:** Add real-time audio processing

| Feature | Library | Priority |
|---------|---------|----------|
| Compressor/Limiter | Tuna.js or native | P1 |
| Parametric EQ | Web Audio BiquadFilter | P2 |
| Noise Reduction | Custom or external | P2 |
| De-esser | Custom implementation | P3 |
| Reverb presets | Tuna.js Convolver | P3 |

**Implementation Notes:**
- Effects would be preview-only in browser
- Final processing via FFmpeg for file output
- Could add "preview effect" toggle

**FFmpeg commands for effects:**
```bash
# Compressor
-af "acompressor=threshold=-20dB:ratio=4:attack=5:release=50"

# High-pass filter (remove rumble)
-af "highpass=f=80"

# De-esser (reduce sibilance)
-af "deesser=f=8000"

# Noise reduction (requires noise profile)
-af "afftdn=nf=-25"
```

---

### Path 3: Recording Integration (Medium Effort)

**Goal:** Record directly into the editor

| Feature | Plugin/Tool | Priority |
|---------|-------------|----------|
| Basic recording | WaveSurfer Record | P2 |
| Recording countdown | Custom UI | P2 |
| Insert recording at playhead | Custom | P3 |
| Overdub/punch-in | Advanced integration | P3 |

**Implementation Notes:**
- Record plugin requires microphone permissions
- Would need to save recording to server
- Could "insert" recording at current position

---

### Path 4: Undo/Redo System (Medium Effort)

**Goal:** Non-destructive editing workflow

**Current State:** Each edit overwrites file (with backup)

**Proposed:**
- Keep edit history in session
- Undo button reverts to previous backup
- Redo re-applies last undone edit
- Visual history panel showing edit sequence

**Implementation:**
- Track backup file paths in state
- "Undo" loads previous backup
- Limit to 10 undo steps (storage management)

---

### Path 5: Advanced Waveform Features (Higher Effort)

| Feature | Approach | Priority |
|---------|----------|----------|
| Multi-track view | Multiple WaveSurfer instances | P3 |
| Split audio at markers | Regions + export | P3 |
| Markers (non-destructive) | Regions plugin | P2 |
| Silence detection | Web Audio analysis | P3 |
| Beat detection | External lib (Meyda) | P3 |

---

### Path 6: Export Options (Low Effort)

**Goal:** More export flexibility

| Feature | Implementation | Priority |
|---------|----------------|----------|
| Export selection only | FFmpeg trim | P2 |
| Export as WAV | FFmpeg format | P2 |
| Quality presets | Use existing encoding settings | P1 |
| Download original backup | API endpoint | P3 |

---

## Recommended Priority Order

### Short Term (Next Sprint)
1. **Compressor effect** - Most requested for podcast editing
2. **Export selection** - Common workflow need
3. **Markers** - Non-destructive annotation

### Medium Term
4. **Spectrogram view** - Professional visualization
5. **Basic recording** - Record intros directly
6. **Undo/Redo** - Essential for editing confidence

### Long Term
7. **Parametric EQ** - Fine-tune frequency response
8. **Noise reduction** - Professional-grade cleanup
9. **Multi-track** - Advanced mixing capability

---

## Technical Considerations

### Performance
- Large files (>30 min) need chunked processing
- Spectrogram is memory-intensive (adjust FFT samples)
- Effects preview requires Web Audio graph complexity

### Browser Compatibility
- Web Audio API: Chrome 35+, Firefox 25+, Safari 6.1+
- AudioWorklets: Chrome 66+, Firefox 76+, Safari 14.1+
- MediaRecorder: Chrome 47+, Firefox 25+, Safari 14.1+

### Server Requirements
- FFmpeg for all permanent file processing
- Temporary file cleanup for preview processing
- Storage for undo history (if implemented)

---

## Resources

- [WaveSurfer.js Documentation](https://wavesurfer.xyz)
- [WaveSurfer Plugins](https://wavesurfer.xyz/plugins)
- [Tuna.js GitHub](https://github.com/Theodeus/tuna)
- [Tone.js](https://tonejs.github.io)
- [Web Audio API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [FFmpeg Audio Filters](https://ffmpeg.org/ffmpeg-filters.html#Audio-Filters)

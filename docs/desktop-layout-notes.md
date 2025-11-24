# Desktop Layout Design Notes

## Layout Structure

### TOP SECTION: Compact NOW PLAYING Bar
- Horizontal bar across full width of page (similar to YouTube's top player)
- Height: ~80-100px
- Layout: Station Logo (left) | Show Artwork (small) | Show Title + Host | Time Remaining | Play/Pause Button (right)
- Sticky at top when scrolling
- Compact and efficient use of vertical space

### MAIN SECTION: Full Week Calendar
- Full width below NOW PLAYING bar
- 7 columns (Mon-Sun)
- Time slots vertically (6 AM - 10 PM or customizable)
- Colored show blocks
- Current time indicator (red line)
- Hover shows tooltip with basic info + "More Info" button
- Click "More Info" or show block opens modal

### MODAL: Show Detail Overlay
- Centered modal, taller/narrower to use vertical space
- Width: ~600px (not too wide)
- Scrollable content if needed
- Background dimmed
- Close X button top right
- Contents:
  - Large show artwork
  - Title, host, badge
  - Description
  - Tags
  - Schedule info
  - RSS feed
  - Latest Episodes (horizontal rectangular cards, stacked vertically - not scrolling row)

## Key Differences from Initial Mockup

❌ **Old:** Sidebar with NOW PLAYING on left  
✅ **New:** Compact horizontal bar at top

❌ **Old:** Modal wide and horizontal  
✅ **New:** Modal taller/narrower, uses vertical space

## Images to Generate (when quota resets)

1. **Desktop Landing Page** - Top bar + calendar grid
2. **Desktop Show Modal** - Centered overlay with vertical layout
3. **Desktop Hover Tooltip** (optional) - Showing "More Info" interaction

---
title: "Publishing Podcast Episodes"
category: "Podcasting"
order: 1
relatedTopics:
  - "rss-feed-management"
  - "episode-metadata"
keywords:
  - "podcast"
  - "episode"
  - "publish"
  - "rss feed"
---

# Publishing Podcast Episodes

Convert your recordings into podcast episodes and distribute them via RSS feeds.

## The Publishing Workflow

```
Recording → Edit Audio → Add Metadata → Publish → RSS Feed Updates
```

## From Recording to Episode

### Automatic Publishing

If configured, recordings automatically become episodes:

1. **Show Records** - Recording completes successfully
2. **Episode Created** - Database entry generated
3. **RSS Updates** - Feed includes new episode
4. **Available** - Listeners can download immediately

### Manual Publishing

To manually create an episode from a recording:

1. Navigate to **Recordings** page
2. Find the completed recording
3. Click **Publish as Episode**
4. Add episode-specific metadata
5. Click **Publish**

## Episode Metadata

### Required Fields

**Title**
- Episode name (e.g., "Episode 42: Special Guest Interview")
- Defaults to: "{Show Name} - {Date}"

**Description**
- Episode summary for listeners
- Supports markdown formatting
- Appears in podcast apps

**Audio File**
- Automatically linked from recording
- Can be replaced with edited version

### Optional Fields

**Episode Number**
- Sequential numbering (1, 2, 3...)
- Useful for serialized content

**Season Number**
- Group episodes by season
- Common for narrative podcasts

**Episode Type**
- **Full**: Standard episode
- **Trailer**: Show preview
- **Bonus**: Extra content

**Explicit Content**
- Override show-level setting
- Mark individual episodes

**Publication Date**
- When episode should appear in feed
- Default: Current date/time
- Can schedule future releases

## Editing Episodes

### Audio Editing

**Using Built-in Editor:**

1. Click **Edit** on episode card
2. Click **Edit Audio** button
3. WaveSurfer editor opens
4. Trim, fade, normalize as needed
5. Save changes

**Using External Editor:**

1. Download audio file
2. Edit in your preferred tool (Audacity, etc.)
3. Return to episode
4. Click **Replace Audio**
5. Upload edited file

### Metadata Editing

1. Click **Edit** on episode card
2. Modify any fields
3. Click **Save Changes**
4. RSS feed updates automatically

## RSS Feed Distribution

### How It Works

Radio Suite generates iTunes-compatible RSS feeds:

**Feed URL Format:**
```
https://yoursite.com/api/rss/{show-id}.xml
```

**Feed Contents:**
- Show metadata
- Episode list (newest first)
- Enclosure links to audio files
- iTunes-specific tags

### Submitting to Directories

**Apple Podcasts:**
1. Copy RSS feed URL
2. Visit [Podcasts Connect](https://podcastsconnect.apple.com)
3. Submit feed for review
4. Wait for approval (1-2 weeks)

**Spotify:**
1. Copy RSS feed URL
2. Visit [Spotify for Podcasters](https://podcasters.spotify.com)
3. Claim your podcast
4. Verify ownership

**Other Platforms:**
Most platforms accept iTunes-compatible feeds:
- Google Podcasts
- Pocket Casts
- Overcast
- Castro

### RSS Feed Features

**Automatic Updates:**
- Feed regenerates when episodes change
- Podcast apps poll feed for updates
- New episodes appear automatically

**iTunes Tags:**
- `<itunes:author>`
- `<itunes:category>`
- `<itunes:explicit>`
- `<itunes:image>`
- Full iTunes specification compliance

## Episode Visibility

### Published vs. Unpublished

**Published Episodes:**
- ✅ Appear in RSS feed
- ✅ Visible to listeners
- ✅ Downloadable

**Unpublished Episodes:**
- ❌ Hidden from RSS feed
- ❌ Not visible to public
- ✅ Visible in admin interface

**To Unpublish:**
1. Edit episode
2. Toggle "Published" off
3. Save

> **📖 Note:** Unpublishing removes episode from feed but doesn't delete the file.

## Scheduling Future Releases

Set publication date in the future:

1. Edit episode metadata
2. Set **Publication Date** to future date
3. Save episode

**Behavior:**
- Episode exists in database
- RSS feed excludes it until publication date
- Automatically appears when date arrives

## Deleting Episodes

**To Delete:**
1. Click **Delete** on episode card
2. Choose deletion option:
   - **Delete Episode Only**: Removes from RSS, keeps recording
   - **Delete Episode & Recording**: Removes both

> **⚠️ Warning:** Deletion is permanent! Backup important episodes before deleting.

**Effect on RSS Feed:**
- Episode removed immediately
- Podcast apps may cache for 24-48 hours
- Links to audio file become 404

## Episode Audio Quality

### File Format

**Recommended:**
- Format: MP3
- Bitrate: 128-192 kbps (talk), 192-256 kbps (music)
- Sample Rate: 44.1 kHz
- Channels: Stereo or Mono

### File Size Considerations

**Average File Sizes (1 hour):**
- 96 kbps: ~43 MB
- 128 kbps: ~58 MB
- 192 kbps: ~86 MB
- 256 kbps: ~115 MB

**Guidelines:**
- Talk shows: 96-128 kbps is sufficient
- Music shows: 192-256 kbps recommended
- Balance quality vs. download size

## Episode Artwork

### Show-Level Artwork

By default, episodes use the show's cover image.

### Episode-Specific Artwork

To use custom artwork for an episode:

1. Edit episode
2. Upload episode artwork
3. Save

**Requirements:**
- Square image (1:1 aspect ratio)
- Minimum: 1400x1400px
- Recommended: 3000x3000px
- Format: JPG or PNG

## Troubleshooting

### "Episode not appearing in podcast app"

**Possible Causes:**
- Publication date is in the future
- Episode is unpublished
- Podcast app hasn't refreshed feed

**Solutions:**
1. Verify episode is published
2. Check publication date
3. Force refresh in podcast app
4. Wait 24 hours for cache to clear

### "Audio file not playing"

**Possible Causes:**
- File path is incorrect
- Audio file was deleted
- Encoding is incompatible

**Solutions:**
1. Verify file exists on server
2. Check file permissions
3. Re-encode to MP3 if needed
4. Test file in browser/media player

### "RSS feed shows old episodes"

**Possible Causes:**
- Podcast app cache
- CDN caching
- Browser cache

**Solutions:**
1. Force refresh in podcast app
2. Clear browser cache
3. Wait 24-48 hours
4. Verify feed URL is correct

## Best Practices

### Metadata
- Write compelling episode descriptions
- Use consistent naming conventions
- Include episode numbers for serialized content
- Tag explicit content appropriately

### Publishing Schedule
- Maintain consistent release schedule
- Publish same day/time each week
- Schedule future episodes in advance

### Quality Control
- Listen to full episode before publishing
- Check audio levels (loudness normalization)
- Verify metadata is complete
- Test episode in podcast app

### SEO & Discovery
- Include keywords in titles/descriptions
- Use relevant iTunes categories
- Add transcripts (future feature)
- Cross-promote on social media

## Related Topics

- **[RSS Feed Management](/help/rss-feed-management)** - Manage podcast feeds
- **[Episode Metadata](/help/episode-metadata)** - Optimize episode data
- **[Audio Editing](/help/audio-editing)** - Edit recordings

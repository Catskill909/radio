---
title: "Creating Your First Show"
category: "Getting Started"
order: 2
relatedTopics:
  - "scheduling-basics"
  - "recording-configuration"
keywords:
  - "create show"
  - "new show"
  - "show metadata"
  - "first show"
---

# Creating Your First Show

Learn how to create a radio show with all the metadata needed for scheduling and podcasting.

## Step 1: Open the Create Form

1. Navigate to **Shows** in the sidebar
2. Click the **+ Create Show** button in the top-right corner

The full-screen form appears with all the fields you need.

## Step 2: Basic Information

### Title
Give your show a memorable name (e.g., "Morning Jazz," "Tech Talk Radio")

### Host
Enter the host's name — this appears in podcast feeds and show details

### Description
Write a compelling description for listeners. This is used in:
- RSS feed `<description>` tag
- Show cards throughout the app
- Public listen page

### Show Type
Choose the category that best describes your show:

- **Local Podcast** - Original podcast content
- **Syndicated Podcast** - Rebroadcast podcast from another source
- **Local Music** - Original music programming
- **Syndicated Music** - Rebroadcast music content

This affects visual styling in the schedule calendar.

## Step 3: Podcast Metadata

These fields ensure your RSS feed is iTunes-compatible:

### Author
The person or organization producing the show

### Email
Contact email for the show (appears in RSS `<itunes:owner>`)

### Category
Choose a podcast category (e.g., "Music," "News," "Comedy")

### Tags
Comma-separated keywords for discoverability

### Explicit Content
Toggle on if your show contains explicit language or content

### Language
Default is English (`en`) — change if needed

### Copyright
Copyright information (e.g., "© 2024 Your Station Name")

### Website Link
Optional URL to the show's website

## Step 4: Recording Settings

### Enable Recording
Toggle **on** to automatically record this show when scheduled

### Recording Source
Select an Icecast stream from the dropdown. You must add streams in the **Streams** page first.

> **💡 Tip:** If you don't see your stream, go to **Streams** → **+ Add Stream** to add it.

## Step 5: Cover Artwork

Upload a square image (recommended 3000x3000px):
- **Drag & drop** an image onto the upload area
- OR **click** to browse files

Supports JPG and PNG. The image appears in:
- Schedule calendar
- Podcast feeds
- Episode cards
- Public listen page

> **📖 Note:** If you don't upload an image, the station's default artwork (from Settings) is used.

## Step 6: Create the Show

Click **Create Show** at the bottom of the form.

If successful, you'll see your new show in the Shows list!

## What's Next?

Now that you have a show, it's time to schedule it:

- **[Schedule Your Show](/help/scheduling-basics)** - Add it to the calendar
- **[Recording Configuration](/help/recording-configuration)** - Configure audio quality
- **[Podcast Distribution](/help/rss-feeds)** - Share your RSS feed

## Troubleshooting

**"Recording source required when recording is enabled"**
- You must select a stream source OR disable recording

**Image upload fails**
- Check file size (max 10MB)
- Ensure file is JPG or PNG format

**Show doesn't appear in schedule modal**
- Refresh the page
- Check that the show was created successfully (look in Shows page)

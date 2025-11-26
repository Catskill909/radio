---
title: Public Listen Page
description: How to configure and share your station's public player page.
category: Getting Started
icon: fa-solid fa-radio
related: ["station-timezone", "station-identity"]
---

# Public Listen Page

Your station comes with a built-in public landing page available at `/listen`. This page allows listeners to tune in to your live broadcast and view your schedule.

## Features

- **Live Player:** A persistent audio player that continues playing while users browse the schedule.
- **Now Playing:** Displays the current show's metadata and artwork in real-time.
- **Weekly Schedule:** A 7-day view of your programming schedule, automatically adjusted to the listener's local time.
- **Show Details:** Listeners can click on any show card to view the full description and host information.

## Configuration

To set up your public page:

1.  **Set Station Identity:** Go to **Settings > Station Identity** to upload your logo and set your station name. These appear on the public page.
2.  **Select Public Stream:** Go to **Settings > Default Stream**. Choose which of your Icecast streams should play when users click the "Play" button.
    > [!NOTE]
    > You must have at least one active Icecast stream configured for the player to work.

## Sharing Your Station

You can share your station using the URL:
`https://your-radio-suite-domain.com/listen`

This page is fully responsive and works on desktop, tablet, and mobile devices.

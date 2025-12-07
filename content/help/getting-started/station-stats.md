# Station Stats Dashboard

The Station Stats dashboard provides real-time monitoring of your station's health and activity.

## Overview

Access the Stats page from the sidebar to view:

- **WebSocket Status** – Connection to real-time updates
- **Streams** – Online/offline status of your audio streams
- **Recordings** – Recent recording activity and events

## Recording Event Log

The Recording Event Log shows live updates as recordings:
- **Start** – When a scheduled recording begins
- **Complete** – When a recording finishes successfully
- **Fail** – If a recording encounters an error

Events appear in real-time via WebSocket and persist after page reload.

## Stream Status

The Stream Status section shows each configured Icecast stream with:
- Current online/offline status
- Visual indicators (green = online, red = offline)

## Tips

- Keep the Stats page open to monitor long-running recordings
- The "Live Updates" indicator confirms your WebSocket connection is active
- Click "View All →" to see your complete recordings library

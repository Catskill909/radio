# Stream Failover & Email Alerts - Planning Document

> **Status:** PLANNING ONLY - No code changes yet. Awaiting user review.

---

## Executive Summary

Two new features to improve station reliability:

1. **Email Alerts** – Notify admins when a stream goes offline
2. **Automatic Failover** – Switch to backup stream when primary fails

---

## Current Architecture (Audit Summary)

### What Exists Today

| Component | Location | Purpose |
|-----------|----------|---------|
| Stream Health API | `/api/streams/health` | Checks all streams every 30s |
| WebSocket Broadcast | `broadcastStreamHealth()` | Real-time status push to clients |
| Stream Tester | `lib/stream-tester.ts` | Tests stream connectivity (10s timeout) |
| Settings Stream | `StationSettings.streamUrl` | Primary stream for `/listen` + recording |
| Recorder Service | `recorder-service.ts` | Uses show's `recordingSource` for recording |

### Stream Status Flow (Current)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Health API      │───▶│ Test Each Stream │───▶│ Update Database │
│ /30s interval   │    │ (testStream())   │    │ + Broadcast WS  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Database Schema (Relevant)

```prisma
model IcecastStream {
  id           String    @id
  name         String
  url          String
  isEnabled    Boolean   @default(false)
  status       String    @default("unknown")  // online, offline, error, testing
  errorMessage String?
  lastChecked  DateTime?
}

model StationSettings {
  streamUrl   String?   // Currently selected primary stream
  email       String?   // Station contact email (exists but unused for alerts)
}
```

---

## Feature 1: Email Alerts

### User Story
> As a station admin, I want to receive email notifications when a stream goes down so I can take action quickly.

### Proposed Settings UI

Add a new card to Settings page:

```
┌─────────────────────────────────────────────────────────┐
│ 📧 Stream Alert Notifications                       (?) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Alert Recipients                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ admin@station.com                           ❌ │   │
│  │ engineer@station.com                        ❌ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────────────────────────┐  ┌────────────────┐ │
│  │ Add email address...         │  │  + Add Email   │ │
│  └───────────────────────────────┘  └────────────────┘ │
│                                                         │
│  Alert Preferences                                      │
│  ○ All enabled streams                                  │
│  ● Primary stream only                                  │
│                                                         │
│  Cooldown: [5 minutes ▾]  (prevents spam)              │
│                                                         │
│  ┌───────────────────┐                                  │
│  │  💾 Save Alerts   │                                  │
│  └───────────────────┘                                  │
└─────────────────────────────────────────────────────────┘
```

### Database Changes

```prisma
model StationSettings {
  // ... existing fields ...
  
  // Email Alert Settings
  alertEmails       String?   // JSON array: ["admin@station.com", "eng@station.com"]
  alertAllStreams   Boolean   @default(false)  // true = all, false = primary only
  alertCooldownMins Int       @default(5)      // Minimum minutes between alerts
  lastAlertSent     DateTime? // Prevent spamming
}
```

### Email Service: In-App SMTP Configuration

Configure SMTP settings directly in the Settings UI (no environment variables needed).

#### Proposed Settings UI

```
┌─────────────────────────────────────────────────────────┐
│ 📧 Email Configuration                              (?) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SMTP Server                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ mail.yourdomain.com                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Port: [587 ▾]   ☑ Use TLS/STARTTLS                    │
│                                                         │
│  Username                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ alerts@yourdomain.com                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Password                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ••••••••                                    👁  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  From Name                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ StationDock Alerts                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────┐  ┌─────────────────────────┐     │
│  │  🧪 Test Email   │  │  💾 Save SMTP Settings  │     │
│  └──────────────────┘  └─────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

#### Database Schema Addition

```prisma
model StationSettings {
  // ... existing fields ...
  
  // SMTP Configuration (stored in DB, password encrypted)
  smtpHost       String?   // e.g., "mail.starkey.digital"
  smtpPort       Int       @default(587)
  smtpUser       String?   // e.g., "radio@starkey.digital"
  smtpPassword   String?   // Encrypted before storage
  smtpFromName   String?   @default("StationDock Alerts")
  smtpUseTls     Boolean   @default(true)
}
```

#### Security Measures

| Measure | How |
|---------|-----|
| **Admin-only access** | Settings page requires `ADMIN_PASSWORD` login |
| **Password encryption** | Uses AES-256 encryption before DB storage |
| **Server-side only** | SMTP creds never sent to browser |
| **Password masking** | UI shows `••••••••`, not plaintext |

#### Encryption Approach

```typescript
// lib/crypto.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-for-dev';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', 
    crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32), iv);
  return iv.toString('hex') + ':' + 
    cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

export function decrypt(encrypted: string): string {
  const [ivHex, data] = encrypted.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc',
    crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32), 
    Buffer.from(ivHex, 'hex'));
  return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
}
```

> **Note:** Add `ENCRYPTION_KEY` to Coolify env vars for production security.

### Trigger Logic

Add to `/api/streams/health/route.ts`:

```typescript
// Pseudocode
if (previousStatus === 'online' && newStatus === 'offline') {
  // Check if this is the primary stream OR alertAllStreams is on
  // Check cooldown period
  // Send email to all alert recipients
  await sendStreamDownAlert(stream, alertEmails);
}

if (previousStatus !== 'online' && newStatus === 'online') {
  // Optional: Send "stream recovered" email
  await sendStreamRecoveredAlert(stream, alertEmails);
}
```

---

## Feature 2: Automatic Failover

### User Story
> As a station admin, I want listeners to automatically switch to a backup stream when my primary fails, ensuring uninterrupted playback.

### Proposed Settings UI

Extend the "Default Stream" card:

```
┌─────────────────────────────────────────────────────────┐
│ 📡 Default Stream                                    (?) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  (•)) Station Audio Stream                              │
│  Select the Icecast stream to play on the public page.  │
│                                                         │
│  Primary Stream                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Main Studio (https://stream.example.com/live) ▾ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🔄 Backup Stream (optional)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Backup CDN (https://backup.example.com/live)  ▾ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ☑ Auto-failover when primary goes offline              │
│  ☑ Auto-return when primary recovers                    │
│                                                         │
│  ┌───────────────────┐                                  │
│  │  💾 Save Stream   │                                  │
│  └───────────────────┘                                  │
└─────────────────────────────────────────────────────────┘
```

### Database Changes

```prisma
model StationSettings {
  // ... existing fields ...
  
  streamUrl        String?   // Primary stream (existing)
  backupStreamUrl  String?   // NEW: Backup stream URL
  autoFailover     Boolean   @default(true)   // NEW: Enable auto-switch
  autoReturn       Boolean   @default(true)   // NEW: Return when primary recovers
  isOnBackup       Boolean   @default(false)  // NEW: Currently using backup?
}
```

### Failover Logic Flow

```
┌──────────────────┐
│ Health Check API │
│ (Every 30s)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     YES     ┌──────────────────────┐
│ Primary offline? │─────────────▶│ Switch to backupUrl │
│ + autoFailover?  │              │ Set isOnBackup=true │
└────────┬─────────┘              └──────────┬───────────┘
         │ NO                                │
         ▼                                   ▼
┌──────────────────┐     YES     ┌──────────────────────┐
│ Primary online?  │─────────────▶│ Switch to primary   │
│ + isOnBackup?    │              │ Set isOnBackup=false│
│ + autoReturn?    │              └──────────────────────┘
└──────────────────┘
```

### Frontend Impact (`/listen` page)

The listen page already fetches stream URL from `/api/public/station`. Changes needed:

1. **API Response**: Return `activeStreamUrl` (resolved from primary OR backup based on `isOnBackup`)
2. **Player**: If stream fails mid-playback, trigger re-fetch of stream URL
3. **UI Indicator**: Optional banner "Playing from backup stream"

### Recording Considerations

> ⚠️ **Important**: Recording uses per-show `recordingSource`, NOT `StationSettings.streamUrl`.

Failover affects:
- ✅ Public `/listen` page
- ✅ Admin `MiniPlayer` component  
- ❌ Does NOT affect scheduled recordings (they use show-specific sources)

**Question for user:** Should failover also apply to the show's recording source, or keep recordings independent?

---

## Implementation Phases

### Phase 1: SMTP Config + Email Alerts

| Step | Files Changed |
|------|---------------|
| 1. Schema: SMTP + alert fields | `prisma/schema.prisma` |
| 2. Encryption utility | `lib/crypto.ts` (new) |
| 3. SMTP config UI | `components/SMTPConfigForm.tsx` (new) |
| 4. Alert recipients UI | `components/AlertEmailSettings.tsx` (new) |
| 5. Settings page sections | `app/settings/page.tsx` |
| 6. Email service | `lib/email-alerts.ts` (new) |
| 7. Health check trigger | `app/api/streams/health/route.ts` |

**Includes:** Per-stream cooldown, recovery notifications ✅

### Phase 2: Listen Page Failover

| Step | Files Changed |
|------|---------------|
| 1. Schema: backup stream fields | `prisma/schema.prisma` |
| 2. Extend StationStreamForm | `components/StationStreamForm.tsx` |
| 3. Failover logic in health API | `app/api/streams/health/route.ts` |
| 4. Update /api/public/station | `app/api/public/station/route.ts` |
| 5. WebSocket broadcast | `server.ts` |
| 6. Listen page handling | `app/listen/page.tsx` |
| 7. MiniPlayer handling | `components/MiniPlayer.tsx` |

### Phase 3: Recording Failover (Part 1/Part 2 Approach) 🆕

**Leverages existing infrastructure:**
- `recoverOrphanedRecordings()` – already catches stuck recordings
- `handleRecordingCompletion()` – already has self-healing for failed files
- Multiple recordings can link to same `scheduleSlotId`

| Step | Files Changed |
|------|---------------|
| 1. Add stream failure detection | `recorder-service.ts` |
| 2. Complete current recording | Use existing `handleRecordingCompletion()` |
| 3. Check for backup stream | New helper function |
| 4. Start Part 2 recording | Use existing `startRecording()` |
| 5. Title suffix logic | `handleRecordingCompletion()` |
| 6. UI: Show parts | Episode list in modals |

**Logic flow:**
```
Recording in progress
    ↓
Stream fails (ffmpeg error event)
    ↓
handleRecordingCompletion() → "Part 1" saved
    ↓
Check: Time remaining on slot?
    ├── NO  → Done (single part)
    └── YES → Check backup stream online?
                ├── NO  → Done (partial recording)
                └── YES → startRecording() with backup → "Part 2"
```

**Episode titles:**
- Single file: `Show Name - December 21, 2025`
- Multi-part: `Show Name - December 21, 2025 (Part 1)`, `...  (Part 2)`

**Complexity:** ⭐⭐ Medium (uses existing functions)
**Risk:** Low (failure = graceful completion, not crash)


---

## Deep Integration Safety Audit

### File-by-File Impact Analysis

| File | Feature | Change Type | Breaking Risk |
|------|---------|-------------|---------------|
| `prisma/schema.prisma` | Both | **Add** new fields | ✅ None - additive only |
| `app/api/streams/health/route.ts` | Alerts + Failover | **Modify** – add email & failover logic | ✅ None - existing flow unchanged |
| `app/settings/page.tsx` | Both | **Add** new sections | ✅ None - new cards added |
| `components/StationStreamForm.tsx` | Failover | **Extend** – add backup dropdown | ✅ None - optional field |
| `components/SMTPConfigForm.tsx` | Alerts | **New** file | ✅ None - new component |
| `components/AlertEmailSettings.tsx` | Alerts | **New** file | ✅ None - new component |
| `lib/email-alerts.ts` | Alerts | **New** file | ✅ None - utility |
| `lib/crypto.ts` | Alerts | **New** file | ✅ None - utility |
| `app/api/public/station/route.ts` | Failover | **Modify** – resolve active stream | ✅ None - backward compatible |
| `app/listen/page.tsx` | Failover | **Modify** – handle stream switch | ⚠️ Low - adds error recovery |
| `components/MiniPlayer.tsx` | Failover | **Modify** – handle stream switch | ⚠️ Low - adds error recovery |

### Existing Functions Preserved

| Function | Location | Status |
|----------|----------|--------|
| Stream health checks | `/api/streams/health` | ✅ Unchanged, hooks added |
| WebSocket broadcasts | `broadcastStreamHealth()` | ✅ Unchanged, new event types |
| Stream dropdown filter | `StationStreamForm.tsx` | ✅ Already filters by `isEnabled` |
| Player audio handling | `/listen` page | ✅ Enhanced with recovery |
| Recording sources | Per-show `recordingSource` | ✅ Completely separate |

### Safe Implementation Order

```
1. SMTP Settings UI     ──▶ New component, no existing code touched
2. Encryption utilities ──▶ New utility file
3. Alert Email Settings ──▶ New component, new Settings section
4. Health check hooks   ──▶ Add email trigger (3 lines of code)
5. Test thoroughly      ──▶ Verify no regressions
────────────────────────────────────────────────────────────
6. Backup stream field  ──▶ Extend existing form
7. Failover logic       ──▶ Add to health check
8. Station API update   ──▶ Resolve active stream URL
9. Player recovery      ──▶ Handle stream errors gracefully
```

---

## Recommended Additional Features

While implementing these, consider adding:

### 1. Stream Health History Log 📊
- Log all status changes to a new `StreamHealthLog` table
- Show history graph on Streams page
- Helps identify patterns (e.g., "stream fails every Sunday at 3 PM")

### 2. Public Status Page Widget 🔴🟢
- Simple endpoint `/api/public/status` returning stream health
- Embeddable badge for station website
- Shows "Live" / "Offline" with timestamp

### 3. Discord/Slack Webhook Alerts 💬
- Alternative to email for teams already using chat
- Simple webhook URL field in Settings
- Sends formatted message on stream down/up

### 4. Alert Sound in Admin Dashboard 🔔
- Optional browser notification when stream goes down
- Useful if admin dashboard is open in background
- Uses existing WebSocket infrastructure

### 5. Cooldown Per-Stream 🕐
- Instead of global cooldown, track per-stream
- Avoids missing alerts if multiple streams fail in sequence

---

## Updated Open Questions

1. ~~SMTP Provider~~ → **Resolved:** In-app SMTP configuration with encrypted storage

2. **Alert Frequency**: Is 5-minute cooldown appropriate, or should it be configurable per-stream?

3. **Recovery Notifications**: Should we also send email when a stream comes BACK online?

4. **Recording Failover**: Should the recorder service also use the backup stream if the show's source is down?

5. **UI Feedback**: On failover, should listeners see a banner/toast indicating they're on a backup stream?

6. **Additional Features**: Any of the recommended features above interest you?

---

## Summary

| Feature | Files Changed | New Files | Breaking Changes |
|---------|---------------|-----------|------------------|
| SMTP Config UI | 2 | 2 | None |
| Email Alerts | 2 | 2 | None |
| Auto-Failover | 4 | 0 | None |

**Implementation is fully additive** – no existing functionality will be modified in breaking ways.

**Recommendation:** Start with SMTP Config + Email Alerts (Phase 1), then add Failover (Phase 2).

---

*This is a planning document. No code changes have been made. Ready to implement when you give the go-ahead.*

**Recommendation:** Implement Email Alerts first as a standalone feature, then tackle Failover.

---

*This is a planning document. No code changes have been made. Please review and provide feedback on the approach.*

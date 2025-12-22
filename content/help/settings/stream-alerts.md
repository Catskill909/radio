---
title: Stream Alerts
description: Get notified when your streams go offline or recover with email alerts.
category: Settings
---

# Stream Alerts

StationDock can automatically notify your team when streams go offline or recover. This helps you respond quickly to outages and ensures your listeners stay informed.

## Prerequisites

Before configuring stream alerts, you must:

1. **Configure SMTP settings** in the Email Configuration section above
2. **Send a test email** to verify your email setup works

> **Note**: The "Email not configured" warning will appear until you complete the SMTP setup.

---

## Alert Recipients

Add email addresses for team members who should be notified about stream issues.

### Adding Recipients

1. Enter an email address in the input field
2. Click **Add** (or press Enter)
3. The email appears as a pill/tag below
4. Click the **X** on any email to remove it

### Team Visibility

When an alert is sent, the email will show all recipients so your team knows who else was notified. This prevents duplicate responses to the same issue.

---

## Alert Preferences

### Monitor All Streams

| Setting | Behavior |
|---------|----------|
| **OFF** (default) | Only alerts when the **primary stream** (set in Settings → Default Stream) goes offline |
| **ON** | Alerts when **any enabled stream** goes offline |

> **Tip**: If you only have one stream, this setting doesn't matter. It becomes useful when you have backup streams configured.

### Recovery Notifications

| Setting | Behavior |
|---------|----------|
| **ON** (default) | Sends an email when a stream comes back online |
| **OFF** | Only sends alerts for outages, not recoveries |

Recommended to keep **ON** so your team knows when an issue is resolved.

### Alert Cooldown

Prevents alert spam by enforcing a minimum time between notifications for the same stream.

| Option | Use Case |
|--------|----------|
| **1 minute** | Immediate notification, may cause spam for flaky connections |
| **5 minutes** (default) | Good balance for most stations |
| **15-30 minutes** | For stations with known intermittent issues |
| **1 hour** | For non-critical monitoring |

The cooldown is per-stream. If Stream A goes offline, you'll still get an immediate alert for Stream B.

---

## How Alerts Work

1. **Health Check** — StationDock checks stream health every 30 seconds
2. **Detection** — When a stream fails, the system checks if enough time has passed since the last alert
3. **Notification** — If cooldown has passed, emails are sent to all recipients
4. **Recovery** — When the stream comes back, a recovery email is sent (if enabled)

---

## Troubleshooting

### "Email not configured" warning

Complete the SMTP setup in the Email Configuration section above. You need:
- SMTP Host
- Username
- Password
- Click "Save SMTP Settings"

### Not receiving alerts

1. **Check spam folder** — Alert emails may be filtered
2. **Verify email was added** — Look for the email pill in the recipients list
3. **Settings saved?** — Make sure you clicked "Save Alert Settings"
4. **SMTP working?** — Send a test email from the Email Configuration section

### Too many alerts

Increase the **Alert Cooldown** setting to reduce notification frequency.

---

## Email Format

Alert emails include:

**Outage Alert:**
- Stream name and status
- Stream URL
- Time of detection
- List of other recipients notified

**Recovery Alert:**
- Stream name and status
- Time of recovery
- Approximate downtime duration

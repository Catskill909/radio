# Email Alert System - Implementation Handoff Document

> **Purpose:** This document provides everything needed for another application/AI to implement the same email alert configuration system that was built for StationDock.

---

## Executive Summary

This is a **complete SMTP email alert system** with:
- In-app SMTP server configuration (no environment variables required)
- Encrypted password storage (AES-256-CBC)
- Test email functionality
- Alert recipient management with preferences
- React UI components for Settings integration

**Status:** Phase 1 (UI + Test Email) is COMPLETE. Phase 2 (actual stream monitoring → email trigger) is planned but not yet implemented.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         Settings Page                              │
├──────────────────────────────┬─────────────────────────────────────┤
│   SMTPConfigForm.tsx         │   AlertEmailSettings.tsx            │
│   • SMTP Host/Port           │   • Alert Recipients List           │
│   • Username/Password        │   • Monitor All Streams Toggle      │
│   • From Name / TLS Toggle   │   • Recovery Notifications          │
│   • Test Email Button        │   • Alert Cooldown (1-60 min)       │
└──────────────┬───────────────┴────────────────┬────────────────────┘
               │                                 │
               ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Server Actions (actions.ts)                     │
│  • getSmtpSettings()      • getAlertSettings()                       │
│  • updateSmtpSettings()   • updateAlertSettings()                    │
│  • testSmtpConnection()                                              │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                      ▼
┌──────────────────────────┐          ┌──────────────────────────────┐
│   lib/crypto.ts          │          │   Database (Prisma ORM)      │
│   • encrypt(text)        │          │   StationSettings model      │
│   • decrypt(text)        │          │   - smtpHost, smtpPort, etc. │
│   • isEncrypted(text)    │          │   - alertEmails (JSON array) │
└──────────────────────────┘          └──────────────────────────────┘
```

---

## Database Schema

Add these fields to your settings/configuration model:

```prisma
model StationSettings {
  // Your existing fields...
  
  // ─────────────────────────────────────────────────────────────────
  // SMTP Configuration (for email alerts)
  // ─────────────────────────────────────────────────────────────────
  smtpHost       String?                          // e.g., "mail.yourdomain.com"
  smtpPort       Int       @default(587)          // Common: 587 (TLS), 465 (SSL), 25 (unencrypted)
  smtpUser       String?                          // SMTP username/email
  smtpPassword   String?                          // Encrypted before storage (AES-256)
  smtpFromName   String?   @default("App Alerts") // Display name in From header
  smtpUseTls     Boolean   @default(true)         // Use STARTTLS/TLS encryption

  // ─────────────────────────────────────────────────────────────────
  // Alert Settings
  // ─────────────────────────────────────────────────────────────────
  alertEmails       String?                       // JSON array: ["admin@example.com", "team@example.com"]
  alertAllStreams   Boolean   @default(false)     // true = all, false = primary only
  alertCooldownMins Int       @default(5)         // Minimum minutes between alerts
  alertOnRecovery   Boolean   @default(true)      // Send email when recovered
}
```

### Migration Command

After adding fields to schema:

```bash
npx prisma migrate dev --name add_smtp_and_alert_settings
```

For production:

```bash
npx prisma db push
```

---

## Encryption Utility

Create `lib/crypto.ts`:

```typescript
/**
 * Encryption utilities for sensitive data storage
 * Uses AES-256-CBC encryption for SMTP passwords and other secrets
 */

import crypto from 'crypto';

// Use environment variable for production, fallback for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-app-dev-key-change-in-prod';

/**
 * Encrypt a plaintext string using AES-256-CBC
 * Returns a string in format: iv:encryptedData (both hex encoded)
 */
export function encrypt(text: string): string {
    if (!text) return '';

    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create a 32-byte key from the encryption key using scrypt
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'your-app-salt', 32);

    // Create cipher and encrypt
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);

    // Return iv:encrypted as hex strings
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt a string that was encrypted with the encrypt function
 * Expects input in format: iv:encryptedData (both hex encoded)
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return '';

    try {
        const [ivHex, dataHex] = encryptedText.split(':');

        // Recreate the key using the same parameters
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'your-app-salt', 32);
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedData = Buffer.from(dataHex, 'hex');

        // Create decipher and decrypt
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption failed:', error);
        return '';
    }
}

/**
 * Check if a string appears to be encrypted (has our iv:data format)
 */
export function isEncrypted(text: string): boolean {
    if (!text) return false;
    const parts = text.split(':');
    // Should have exactly 2 parts, iv should be 32 hex chars (16 bytes)
    return parts.length === 2 && parts[0].length === 32 && /^[a-f0-9]+$/i.test(parts[0]);
}
```

### Production Requirement

Add `ENCRYPTION_KEY` environment variable in production:

```env
ENCRYPTION_KEY=your-secure-random-32-char-key
```

---

## Server Actions

Add these server actions to your app (Next.js App Router example):

### 1. Get SMTP Settings

```typescript
export async function getSmtpSettings() {
    const settings = await prisma.stationSettings.findFirst({
        select: {
            smtpHost: true,
            smtpPort: true,
            smtpUser: true,
            smtpPassword: true,
            smtpFromName: true,
            smtpUseTls: true,
        }
    });
    return {
        smtpHost: settings?.smtpHost ?? '',
        smtpPort: settings?.smtpPort ?? 587,
        smtpUser: settings?.smtpUser ?? '',
        // Never return actual password - just indicate if one exists
        hasPassword: !!settings?.smtpPassword,
        smtpFromName: settings?.smtpFromName ?? 'App Alerts',
        smtpUseTls: settings?.smtpUseTls ?? true,
    };
}
```

### 2. Update SMTP Settings

```typescript
import { encrypt } from '@/lib/crypto';

export async function updateSmtpSettings(
    smtpHost: string,
    smtpPort: number,
    smtpUser: string,
    smtpPassword: string | null,  // null = keep existing, '' = clear, string = new password
    smtpFromName: string,
    smtpUseTls: boolean
) {
    const updateData: Record<string, unknown> = {
        smtpHost: smtpHost.trim() || null,
        smtpPort: smtpPort,
        smtpUser: smtpUser.trim() || null,
        smtpFromName: smtpFromName.trim() || 'App Alerts',
        smtpUseTls: smtpUseTls,
    };

    // Handle password updates
    if (smtpPassword === '') {
        updateData.smtpPassword = null;  // Clear password
    } else if (smtpPassword) {
        updateData.smtpPassword = encrypt(smtpPassword);  // Encrypt new password
    }
    // If smtpPassword is null, don't include it (keep existing)

    await prisma.stationSettings.upsert({
        where: { id: 'singleton' },  // Or your settings identifier
        update: updateData,
        create: { id: 'singleton', ...updateData }
    });

    return { success: true };
}
```

### 3. Test SMTP Connection

```typescript
import nodemailer from 'nodemailer';
import { decrypt, isEncrypted } from '@/lib/crypto';

export async function testSmtpConnection(testEmailAddress: string) {
    // Validate email
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
    }

    // Get SMTP settings
    const settings = await prisma.stationSettings.findFirst({
        select: {
            smtpHost: true,
            smtpPort: true,
            smtpUser: true,
            smtpPassword: true,
            smtpFromName: true,
            smtpUseTls: true,
        }
    });

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
        return {
            success: false,
            error: 'SMTP settings are incomplete. Please configure host, username, and password.'
        };
    }

    // Decrypt password
    let decryptedPassword: string;
    try {
        decryptedPassword = isEncrypted(settings.smtpPassword)
            ? decrypt(settings.smtpPassword)
            : settings.smtpPassword;
    } catch {
        return { success: false, error: 'Failed to decrypt SMTP password. Please re-enter your password.' };
    }

    if (!decryptedPassword) {
        return { success: false, error: 'SMTP password is empty or could not be decrypted.' };
    }

    // Create nodemailer transport
    const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpPort === 465,  // true for 465, false for other ports
        auth: {
            user: settings.smtpUser,
            pass: decryptedPassword,
        },
        tls: settings.smtpUseTls ? {
            rejectUnauthorized: false  // Accept self-signed certs
        } : undefined,
    });

    try {
        // Send test email
        await transporter.sendMail({
            from: `"${settings.smtpFromName}" <${settings.smtpUser}>`,
            to: testEmailAddress,
            subject: '✅ Test Email from Your App',
            html: `
                <h2>Email Configuration Test</h2>
                <p>Congratulations! Your SMTP settings are working correctly.</p>
                <p><strong>SMTP Server:</strong> ${settings.smtpHost}:${settings.smtpPort}</p>
                <p><strong>From:</strong> ${settings.smtpFromName} &lt;${settings.smtpUser}&gt;</p>
                <hr>
                <p>This email was sent as a test from your application's settings page.</p>
            `,
        });

        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to send email: ${errorMessage}` };
    }
}
```

### 4. Alert Settings Actions

```typescript
export async function getAlertSettings() {
    const settings = await prisma.stationSettings.findFirst({
        select: {
            alertEmails: true,
            alertAllStreams: true,
            alertCooldownMins: true,
            alertOnRecovery: true,
            smtpHost: true,  // To check if SMTP is configured
        }
    });

    return {
        alertEmails: settings?.alertEmails ? JSON.parse(settings.alertEmails) : [],
        alertAllStreams: settings?.alertAllStreams ?? false,
        alertCooldownMins: settings?.alertCooldownMins ?? 5,
        alertOnRecovery: settings?.alertOnRecovery ?? true,
        hasSmtpConfigured: !!settings?.smtpHost,
    };
}

export async function updateAlertSettings(
    alertEmails: string[],
    alertAllStreams: boolean,
    alertCooldownMins: number,
    alertOnRecovery: boolean
) {
    await prisma.stationSettings.upsert({
        where: { id: 'singleton' },
        update: {
            alertEmails: JSON.stringify(alertEmails),
            alertAllStreams,
            alertCooldownMins,
            alertOnRecovery,
        },
        create: {
            id: 'singleton',
            alertEmails: JSON.stringify(alertEmails),
            alertAllStreams,
            alertCooldownMins,
            alertOnRecovery,
        }
    });

    return { success: true };
}
```

---

## Required Dependencies

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

---

## UI Components

### SMTPConfigForm Component Structure

The SMTP configuration form includes:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| SMTP Host | text input | `smtp.gmail.com` | Mail server hostname |
| Port | dropdown | 587 | Port options: 587 (STARTTLS), 465 (SSL), 25, 2525 |
| Username | text input | - | Full email address |
| Password | password input | - | Shows "••••••••" if password exists |
| From Name | text input | "App Alerts" | Display name for emails |
| Use TLS | toggle | true | Enable STARTTLS/TLS |
| Test Email | input + button | - | Send test email to verify config |

**Key behaviors:**
- Password field shows masked placeholder if password exists
- Empty password submission = keep existing password
- Clearing password field and saving = remove password
- Test email button disabled until settings are saved

### AlertEmailSettings Component Structure

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Alert Recipients | email input + tag list | [] | Comma-separated or Enter to add |
| Monitor All Streams | toggle | false | Alert on any stream vs. primary only |
| Recovery Notifications | toggle | true | Send email when stream recovers |
| Alert Cooldown | dropdown | 5 min | Options: 1, 5, 10, 15, 30, 60 minutes |

**Key behaviors:**
- Email validation before adding to list
- Warning banner if SMTP not configured
- Tag/pill UI for managing email list

---

## Settings Page Integration

Add these sections to your Settings page:

```tsx
import SMTPConfigForm from "@/components/SMTPConfigForm";
import AlertEmailSettings from "@/components/AlertEmailSettings";
import { getSmtpSettings, getAlertSettings } from "@/app/actions";

export default async function SettingsPage() {
    const smtpSettings = await getSmtpSettings();
    const alertSettings = await getAlertSettings();

    return (
        <div>
            {/* Email Configuration (SMTP) */}
            <section>
                <h2>📧 Email Configuration</h2>
                <SMTPConfigForm initialSettings={smtpSettings} />
            </section>

            {/* Stream Alert Notifications */}
            <section>
                <h2>🔔 Stream Alerts</h2>
                <AlertEmailSettings initialSettings={alertSettings} />
            </section>
        </div>
    );
}
```

---

## Security Considerations

| Security Measure | Implementation |
|------------------|----------------|
| **Admin-only access** | Settings page requires authentication |
| **Password encryption** | AES-256-CBC before database storage |
| **Server-side only** | SMTP credentials never sent to browser |
| **Password masking** | UI shows `••••••••`, not plaintext |
| **No plaintext logging** | Decrypted passwords never logged |

---

## Common SMTP Providers

| Provider | Host | Port | Notes |
|----------|------|------|-------|
| Gmail | smtp.gmail.com | 587 | Requires App Password |
| Outlook/Microsoft 365 | smtp.office365.com | 587 | Requires App Password |
| Yahoo | smtp.mail.yahoo.com | 587 | Requires App Password |
| SendGrid | smtp.sendgrid.net | 587 | API key as password |
| Mailgun | smtp.mailgun.org | 587 | API key as password |
| Web hosting (cPanel/DirectAdmin) | mail.yourdomain.com | 587/465 | Regular account password |

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/crypto.ts` | Encryption/decryption utilities |
| `components/SMTPConfigForm.tsx` | SMTP server configuration UI |
| `components/AlertEmailSettings.tsx` | Alert recipients + preferences UI |
| `app/actions.ts` | Server actions for SMTP & alerts |
| `prisma/schema.prisma` | Database schema with SMTP fields |
| `content/help/settings/email-configuration.md` | Help documentation |
| `content/help/settings/stream-alerts.md` | Help documentation |

---

## What's NOT Implemented Yet (Phase 2+)

This handoff covers the **configuration and test email** functionality only. The following are planned but not yet built:

1. **Actual Alert Triggering** — Monitoring streams and sending alerts when they fail
2. **Recovery Detection** — Detecting when streams come back online
3. **Cooldown Enforcement** — Per-stream cooldown tracking
4. **Alert History/Logging** — Recording when alerts were sent
5. **Automatic Failover** — Switching to backup stream automatically

See [STREAM_ALERTS_FAILOVER_PLAN.md](./STREAM_ALERTS_FAILOVER_PLAN.md) for the full roadmap.

---

## Quick Start Checklist

- [ ] Add schema fields to your database model
- [ ] Run Prisma migration
- [ ] Create `lib/crypto.ts`
- [ ] Install `nodemailer` and `@types/nodemailer`
- [ ] Add server actions to your actions file
- [ ] Create UI components or adapt existing ones
- [ ] Add SMTP and Alert sections to Settings page
- [ ] Set `ENCRYPTION_KEY` environment variable in production
- [ ] Test with Gmail or your SMTP provider

---

*Document created: 2024-12-23*
*Based on StationDock implementation (Phase 1A/1B complete)*

---
title: Email Configuration (SMTP)
description: Configure SMTP settings to send email alerts for stream monitoring and notifications.
category: Settings
---

# Email Configuration

StationDock can send email notifications when streams go offline or recover. This requires configuring an SMTP server to send emails.

## Understanding SMTP Providers

SMTP (Simple Mail Transfer Protocol) is how email is sent. Different providers have different requirements:

| Provider Type | Password Required | Examples |
|--------------|-------------------|----------|
| **Gmail / Google Workspace** | App Password (16 chars) | smtp.gmail.com |
| **Standard hosting** | Regular account password | DirectAdmin, cPanel, Plesk |
| **Outlook / Microsoft 365** | App Password | smtp.office365.com |
| **Transactional email services** | API key | SendGrid, Mailgun, Postmark |

> **Key Point**: Gmail and Microsoft require special "App Passwords" for security. Most web hosting control panels (DirectAdmin, cPanel) use your regular account password.

---

## Gmail Setup (Most Common)

Gmail requires a special App Password due to Google's security requirements.

### Step 1: Enable 2-Step Verification

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Under "Signing in to Google," enable **2-Step Verification**
3. Follow the prompts to set it up

### Step 2: Generate an App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **"Other (Custom name)"** from the dropdown
3. Enter `StationDock` as the name
4. Click **Generate**
5. Copy the 16-character password shown (spaces are automatically removed)

### Step 3: Configure in StationDock

| Field | Value |
|-------|-------|
| SMTP Host | `smtp.gmail.com` (default) |
| Port | 587 (STARTTLS) |
| Username | Your Gmail address (e.g., `you@gmail.com`) |
| Password | The 16-character App Password |
| From Name | Your station name |
| Use TLS | ✅ Enabled |

> **Tip**: StationDock automatically removes spaces from passwords, so you can paste the App Password directly as Google displays it.

---

## DirectAdmin / cPanel / Web Hosting

If you use a web hosting control panel, you typically use your regular email account credentials.

### Example Settings

| Field | Value |
|-------|-------|
| SMTP Host | `mail.yourdomain.com` |
| Port | 587 (STARTTLS) or 465 (SSL) |
| Username | Your full email address |
| Password | Your regular email password |
| From Name | Your station name |
| Use TLS | ✅ Enabled |

> **Note**: Check your hosting provider's documentation for exact SMTP settings. The host is often `mail.yourdomain.com` or `smtp.yourdomain.com`.

---

## Testing Your Configuration

1. Fill in all SMTP settings
2. Click **Save SMTP Settings**
3. Enter your email address in "Send Test Email To"
4. Click **Send Test Email**
5. Check your inbox for the test email

A successful test confirms your settings are correct.

---

## Troubleshooting

### "Username and Password not accepted" (Gmail)

- Make sure you're using an **App Password**, not your regular Google password
- Verify 2-Step Verification is enabled
- Generate a new App Password and try again

### "Connection refused" or "Connection timed out"

- Check the SMTP host is correct
- Try port 465 instead of 587 (or vice versa)
- Ensure your server/hosting allows outbound SMTP connections

### "Certificate error"

- Make sure **Use TLS** is enabled
- If using self-signed certificates, the connection may still work

### Test email not received

- Check your spam/junk folder
- Verify the "Send Test Email To" address is correct
- Wait a few minutes – some mail servers have delays

---

## Common SMTP Settings

| Provider | Host | Port | TLS |
|----------|------|------|-----|
| Gmail | smtp.gmail.com | 587 | ✅ |
| Outlook/Hotmail | smtp.office365.com | 587 | ✅ |
| Yahoo | smtp.mail.yahoo.com | 587 | ✅ |
| SendGrid | smtp.sendgrid.net | 587 | ✅ |
| Mailgun | smtp.mailgun.org | 587 | ✅ |
| Generic hosting | mail.yourdomain.com | 587/465 | ✅ |

---

## Security Notes

- Passwords are encrypted before being stored in the database
- SMTP credentials are never sent to the browser
- For production, consider setting an `ENCRYPTION_KEY` environment variable

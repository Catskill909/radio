# Coolify Deployment Guide - Radio Suite

**Complete Step-by-Step Guide for Production Deployment**

This guide provides everything you need to deploy your Radio Suite application to Coolify using the SQLite strategy. Your local development and production environments will remain identical.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Preparation](#local-preparation)
3. [Coolify Configuration](#coolify-configuration)
4. [First Deployment](#first-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)
8. [Backup Strategy](#backup-strategy)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] **Coolify Instance** - Running and accessible
- [ ] **Git Repository** - GitHub, GitLab, or Gitea with your code pushed
- [ ] **Domain Name** - (Optional) For production URL, or use Coolify's provided domain
- [ ] **Local Development Working** - Verify `npm run dev` works locally

---

## Local Preparation

### Step 1: Verify Configuration Files

Ensure these files exist in your project root:

```bash
cd /Users/paulhenshaw/Desktop/radio-suite
ls -la .env.example .dockerignore nixpacks.toml ecosystem.config.js
```

**Expected files:**
- ✅ `.env.example` - Environment variable template
- ✅ `.dockerignore` - Build optimization
- ✅ `nixpacks.toml` - Build configuration with FFmpeg
- ✅ `ecosystem.config.js` - PM2 process management

### Step 2: Test Production Build Locally

```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
```

**Expected output:**
```
✓ Prisma Client generated successfully
✓ Next.js compiled successfully
```

### Step 3: Test PM2 Process Manager

```bash
# Build and start with PM2
npm run build
npx pm2 start ecosystem.config.js

# Check status
npx pm2 status
```

**Expected output:**
```
┌─────┬──────────┬─────────┬──────┐
│ id  │ name     │ status  │ cpu  │
├─────┼──────────┼─────────┼──────┤
│ 0   │ web      │ online  │ 0%   │
│ 1   │ recorder │ online  │ 0%   │
└─────┴──────────┴─────────┴──────┘
```

Stop the processes when done:
```bash
npx pm2 delete all
```

### Step 4: Commit and Push to Git

```bash
git add .
git commit -m "Add Coolify deployment configuration"
git push origin main
```

---

## Coolify Configuration

### Step 1: Create New Application

1. Log into your Coolify dashboard
2. Click **+ New Resource**
3. Select **Application**
4. Choose your **Git Repository** and **Branch** (e.g., `main`)
5. Click **Continue**

### Step 2: Configure Build Settings

**Build Pack:** Select **Nixpacks** (should auto-detect)

**Port:** `3000`

**Build Command:** (Leave default, uses `nixpacks.toml`)

**Start Command:** (Leave default, uses `nixpacks.toml`)

### Step 3: Set Environment Variables

Navigate to **Environment Variables** tab and add:

```env
DATABASE_URL=file:/app/prisma/dev.db
NEXT_PUBLIC_BASE_URL=https://your-actual-domain.com
NODE_ENV=production
```

> **Important:** Replace `https://your-actual-domain.com` with your actual production URL. This is critical for RSS feeds to generate correct absolute URLs.

### Step 4: Configure Persistent Storage (CRITICAL)

Navigate to **Storages** tab and add these three volumes:

| Name | Source (Container Path) | Destination |
|------|------------------------|-------------|
| Database | `/app/prisma` | Auto-managed by Coolify |
| Recordings | `/app/recordings` | Auto-managed by Coolify |
| Uploads | `/app/uploads` | Auto-managed by Coolify |

**How to add each volume:**
1. Click **+ Add Volume**
2. Enter **Name** (e.g., "Database")
3. Enter **Source** path (container path like `/app/prisma`)
4. Leave **Destination** empty (Coolify auto-manages)
5. Click **Save**

> **Critical:** Without these volumes, your database and uploaded files will be lost on every container restart!

### Step 5: Optional - Configure Domain

If using a custom domain:

1. Navigate to **Domains** tab
2. Add your domain (e.g., `radio.yourdomain.com`)
3. Coolify will automatically configure SSL via Let's Encrypt

---

## First Deployment

### Step 1: Deploy

Click **Deploy** button in Coolify UI.

**Build Process:** Monitor the build logs. You should see:
```
✓ Installing nodejs_20, ffmpeg-full
✓ Running npm ci
✓ Installing pm2
✓ Running npm run build
✓ Prisma Client generated
✓ Next.js compiled
✓ Starting pm2-runtime
```

**Wait for:** "Deployment successful" message (typically 3-5 minutes).

### Step 2: Initialize Database

Once deployment succeeds:

1. Navigate to **Terminal** tab in Coolify
2. Run database migrations:

```bash
npx prisma migrate deploy
```

**Expected output:**
```
✓ Applying migrations
✓ Database synchronized
```

3. Verify database file exists:

```bash
ls -lh /app/prisma/
```

**Expected:** You should see `dev.db` file.

### Step 3: Verify Services Are Running

In the Coolify terminal:

```bash
npx pm2 status
```

**Expected output:**
```
┌─────┬──────────┬─────────┬──────┐
│ id  │ name     │ status  │ cpu  │
├─────┼──────────┼─────────┼──────┤
│ 0   │ web      │ online  │ 0%   │
│ 1   │ recorder │ online  │ 0%   │
└─────┴──────────┴─────────┴──────┘
```

Both `web` and `recorder` should show **online** status.

---

## Post-Deployment Verification

### Checklist

- [ ] **Application loads:** Visit your production URL
- [ ] **Admin panel accessible:** Navigate to `/admin` or relevant admin path
- [ ] **Create test show:** Verify creation works
- [ ] **Restart container:** Verify show still exists (tests persistent volume)
- [ ] **Upload test image:** Verify image persists after restart
- [ ] **RSS feed works:** Visit `/api/feed` and verify correct URLs
- [ ] **Schedule a recording:** Verify recorder service is working

### Detailed Verification Steps

#### Test 1: Data Persistence

1. Create a test show in production
2. In Coolify, click **Restart** on your application
3. After restart, verify the show still exists
4. ✅ **Success:** Persistent volume is working

#### Test 2: File Uploads

1. Upload a show image
2. Restart the container
3. Verify image still displays
4. ✅ **Success:** Uploads volume is working

#### Test 3: Recorder Service

1. Create a show with recording enabled
2. Schedule it to record soon (within next 5 minutes)
3. Wait for scheduled time
4. Check if recording file appears in `/recordings` directory

Access Coolify terminal:
```bash
ls -lh /app/recordings/
```

5. ✅ **Success:** Recording file exists

#### Test 4: RSS Feed URLs

Visit your RSS feed:
```
https://your-domain.com/api/feed
```

Verify:
- URLs contain your production domain (not `localhost:3000`)
- Audio file URLs are absolute and accessible
- ✅ **Success:** RSS feed has correct URLs

---

## Development Workflow

Once deployed, your workflow is:

### 1. Develop Locally

```bash
cd /Users/paulhenshaw/Desktop/radio-suite
npm run dev
```

Make your changes, test locally.

### 2. Commit Changes

```bash
git add .
git commit -m "Description of changes"
```

### 3. Push to Git

```bash
git push origin main
```

### 4. Auto-Deploy

Coolify automatically detects the push and:
- Rebuilds the container
- Restarts the application
- Preserves all data (volumes persist)

### 5. Monitor Deployment

Watch the deployment in Coolify UI:
- Check build logs for errors
- Verify deployment completes successfully

---

## Troubleshooting

### Build Fails with "FFmpeg not found"

**Cause:** Nixpacks configuration not detected

**Solution:**
```bash
# Verify nixpacks.toml exists in root
cat nixpacks.toml

# Should contain:
# [phases.setup]
# nixPkgs = ['nodejs_20', 'ffmpeg-full']
```

---

### Database Resets on Every Deploy

**Cause:** Persistent volume not configured

**Solution:**
1. Go to **Storages** tab in Coolify
2. Add volume: `/app/prisma` → Auto-managed
3. Redeploy

---

### RSS Feed Shows localhost URLs

**Cause:** `NEXT_PUBLIC_BASE_URL` not set correctly

**Solution:**
1. Go to **Environment Variables** in Coolify
2. Update: `NEXT_PUBLIC_BASE_URL=https://your-actual-domain.com`
3. Redeploy

---

### Recorder Service Not Running

**Cause:** PM2 configuration issue

**Solution:**

1. Access Coolify terminal
2. Check PM2 status:
```bash
npx pm2 status
```

3. View logs:
```bash
npx pm2 logs recorder
```

4. If needed, restart:
```bash
npx pm2 restart recorder
```

---

### "Prisma Client not generated" Error

**Cause:** Build script not generating Prisma client

**Solution:**

Verify `package.json` has:
```json
"build": "prisma generate && next build"
```

If not, update and push to git.

---

### Application Crashes After Deployment

**Solution:**

1. Check logs in Coolify UI → **Logs** tab
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Database migration not run
   - Port 3000 already in use (shouldn't happen in Coolify)

---

## Backup Strategy

### Automated Backup Script

Create a backup script on your Coolify server:

```bash
#!/bin/bash
# backup-radio-suite.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"

# Backup database
cp /app/prisma/dev.db "$BACKUP_DIR/db_backup_$DATE.db"

# Backup recordings (optional, if small enough)
tar -czf "$BACKUP_DIR/recordings_backup_$DATE.tar.gz" /app/recordings/

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" /app/uploads/

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
```

### Schedule with Cron

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-radio-suite.sh
```

### Manual Backup

Via Coolify terminal:

```bash
# Database backup
cp /app/prisma/dev.db /app/prisma/dev.db.backup_$(date +%Y%m%d_%H%M%S)

# List backups
ls -lh /app/prisma/*.backup_*
```

### Restore from Backup

```bash
# Stop the application first via Coolify UI

# Restore database
cp /app/prisma/dev.db.backup_YYYYMMDD_HHMMSS /app/prisma/dev.db

# Restart application via Coolify UI
```

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Coolify Container                   │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   PM2 Process Manager        │  │
│  │   ┌────────────┐             │  │
│  │   │ Web (3000) │             │  │
│  │   └────────────┘             │  │
│  │   ┌────────────┐             │  │
│  │   │ Recorder   │             │  │
│  │   └────────────┘             │  │
│  └──────────────────────────────┘  │
│           ↓                         │
│  ┌──────────────────────────────┐  │
│  │   SQLite Database            │  │
│  │   /app/prisma/dev.db         │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Persistent Volumes (Coolify)       │
│  - /app/prisma                      │
│  - /app/recordings                  │
│  - /app/uploads                     │
└─────────────────────────────────────┘
```

---

## Summary

**Key Points:**
- ✅ SQLite with persistent volumes = Simple + Reliable
- ✅ PM2 runs both web and recorder in one container
- ✅ Local and production environments are identical
- ✅ Push to git → Auto-deploy
- ✅ Data persists across deployments

**Environment Variables:**
```env
DATABASE_URL=file:/app/prisma/dev.db
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production
```

**Persistent Volumes:**
1. `/app/prisma` - Database
2. `/app/recordings` - Audio files
3. `/app/uploads` - Images

**First Deploy Checklist:**
1. Create application in Coolify
2. Set environment variables
3. Configure 3 persistent volumes
4. Deploy
5. Run `npx prisma migrate deploy` in terminal
6. Verify services are running

**You're ready to deploy! 🚀**

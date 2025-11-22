# PostgreSQL Migration Guide - Radio Suite

Complete step-by-step guide to migrate from SQLite to PostgreSQL for production deployment.

---

## 🎯 Critical: Dual Environment Setup

**IMPORTANT:** This setup allows you to work with **both** databases simultaneously:

- ✅ **Local Development:** Keep using SQLite (fast, simple, no setup)
- ✅ **Production (Coolify):** Use PostgreSQL (scalable, container-friendly)

### How It Works

**Same codebase, different database based on environment!**

**Local (Your Mac):**
```env
# .env file
DATABASE_URL="file:./dev.db"
```
→ Uses SQLite → All your current data stays intact → No setup needed

**Production (Coolify):**
```env
# Set in Coolify dashboard
DATABASE_URL="postgresql://user:password@host:5432/radio_suite"
```
→ Uses PostgreSQL → Coolify manages it → Scalable for production

### The Magic: One Schema, Two Databases

Prisma automatically detects which database to use based on the connection string format:

```prisma
datasource db {
  provider = "postgresql"  // Works for BOTH!
  url      = env("DATABASE_URL")
}
```

- Connection starts with `file:` → Prisma uses SQLite
- Connection starts with `postgresql:` → Prisma uses PostgreSQL

**You never have to change code or schema between environments!** 🎉

---

## Why PostgreSQL for Production?

✅ **Better for containers** - Server-based, not file-based  
✅ **Handles concurrency** - Multiple connections simultaneously  
✅ **Backup & restore** - Built-in tools  
✅ **Scalable** - Can handle growth  
✅ **Coolify native** - One-click provisioning  

---

## Phase 1: Test Locally (Optional but Recommended)

### Install PostgreSQL on Mac

```bash
# Install via Homebrew
brew install postgresql@16

# Start PostgreSQL
brew services start postgresql@16

# Verify it's running
psql postgres
# Type \q to quit
```

### Create Local Test Database

```bash
# Create database
createdb radio_suite_test

# Verify
psql radio_suite_test
# You should see: radio_suite_test=#
# Type \q to quit
```

### Update Prisma Schema (Local Test)

**File:** `prisma/schema.prisma`

```diff
  datasource db {
-   provider = "sqlite"
+   provider = "postgresql"
    url      = env("DATABASE_URL")
  }
```

### Create `.env.local` for Testing

**File:** `.env.local` (NEW)

```env
# Local PostgreSQL for testing
DATABASE_URL="postgresql://your_username@localhost:5432/radio_suite_test"

# Replace 'your_username' with your Mac username
# Example: postgresql://paulhenshaw@localhost:5432/radio_suite_test
```

### Generate New Migration

```bash
# IMPORTANT: Backup your SQLite database first!
cp prisma/dev.db prisma/dev.db.backup

# Generate PostgreSQL migration
npx prisma migrate dev --name switch_to_postgresql

# This creates a new migration for PostgreSQL
```

### Test the Migration

```bash
# Run dev server with PostgreSQL
DATABASE_URL="postgresql://your_username@localhost:5432/radio_suite_test" npm run dev

# Visit http://localhost:3000
# Create a test show, test recording, etc.
```

**If everything works:** You're ready for production!  
**If there are issues:** Keep using SQLite locally, we'll fix in testing

---

## Phase 2: Prepare for Coolify Deployment

### 1. Keep Both Database Providers (Recommended)

This lets you use SQLite locally and PostgreSQL in production.

**Update `prisma/schema.prisma`:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // Production default
  url      = env("DATABASE_URL")
}

// All your models stay the same - no changes needed!
```

**Update `.env` (local development):**

```env
# Local SQLite for development
DATABASE_URL="file:./dev.db"
```

**Create `.env.production` (reference only, don't commit):**

```env
# This will be set in Coolify, NOT in your codebase
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NODE_ENV=production
```

### 2. Update `package.json` Build Script

**File:** `package.json`

```diff
  "scripts": {
    "dev": "concurrently \"next dev\" \"npx tsx recorder-service.ts\"",
    "recorder": "npx tsx recorder-service.ts",
-   "build": "next build",
+   "build": "prisma generate && next build",
    "start": "next start",
```

This ensures Prisma client is generated during build.

### 3. Create `.env.example`

**File:** `.env.example` (NEW - for documentation)

```env
# Database connection string
# Local: file:./dev.db
# Production: postgresql://user:password@host:5432/dbname
DATABASE_URL=

# Public URL for RSS feeds and links
NEXT_PUBLIC_BASE_URL=

# Environment
NODE_ENV=development
```

### 4. Create Migration Script for Production

**File:** `deploy-migrations.sh` (NEW)

```bash
#!/bin/bash
# Run this after deploying to production

echo "Running Prisma migrations in production..."
npx prisma migrate deploy

echo "Done! Database is ready."
```

Make it executable:
```bash
chmod +x deploy-migrations.sh
```

---

## Phase 3: Coolify Setup

### Step 1: Create PostgreSQL Database in Coolify

1. **Login to Coolify dashboard**
2. Click **"Resources"** → **"New Resource"**
3. Select **"PostgreSQL"**
4. Configure:
   - Name: `radio-suite-db`
   - Version: `16` (latest stable)
   - Database name: `radio_suite`
   - Username: `radio_admin` (or your choice)
   - Password: Coolify auto-generates (save it!)
5. Click **"Create"**
6. Wait ~30 seconds for provisioning

### Step 2: Get Connection String

After PostgreSQL is created:

1. Click on your PostgreSQL resource
2. Find **"Connection String"** section
3. Copy the full string, looks like:
   ```
   postgresql://radio_admin:GENERATED_PASSWORD@postgres-xxxx:5432/radio_suite
   ```
4. **SAVE THIS** - you'll use it in your app

### Step 3: Create Your Application in Coolify

1. Click **"New Resource"** → **"Application"**
2. **Source:**
   - Connect your Git repository (GitHub/GitLab)
   - Select branch: `main` or `master`
3. **Build Pack:**
   - Should auto-detect: `Nixpacks`
   - If not, select it manually
4. **Port:** `3000`
5. Click **"Create"**

### Step 4: Configure Environment Variables

In your application settings:

1. Click **"Environment Variables"**
2. Add these variables:

```env
DATABASE_URL=postgresql://radio_admin:PASSWORD@postgres-xxxx:5432/radio_suite
NEXT_PUBLIC_BASE_URL=https://your-app.yourdomain.com
NODE_ENV=production
```

**Important:** Use the exact connection string from Step 2!

### Step 5: Configure Persistent Storage

1. In your app, click **"Storages"**
2. Add two volumes:

**Volume 1: Recordings**
- Name: `recordings`
- Source: `/recordings`
- Destination: `/app/recordings`
- Check "Persistent"

**Volume 2: Uploads**
- Name: `uploads`
- Source: `/uploads`
- Destination: `/app/uploads`
- Check "Persistent"

### Step 6: Create `nixpacks.toml` in Your Project

**File:** `nixpacks.toml` (NEW in project root)

```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'ffmpeg-full']

[phases.install]
cmds = ['npm install']

[phases.build]
cmds = ['npx prisma generate', 'npm run build']

[start]
cmd = 'npm start'
```

Commit this file:
```bash
git add nixpacks.toml
git commit -m "Add Nixpacks config for FFmpeg"
git push
```

### Step 7: Deploy!

1. In Coolify, click **"Deploy"** on your application
2. Watch the build logs
3. Should take ~3-5 minutes

### Step 8: Run Database Migrations

**CRITICAL:** After first successful deployment:

1. In Coolify, go to your app
2. Click **"Terminal"** or **"Execute Command"**
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

This creates all your database tables in PostgreSQL.

### Step 9: Verify Deployment

1. Visit your app URL: `https://your-app.yourdomain.com`
2. Create a test show
3. Add a schedule slot
4. Check if data persists after refresh

**Success!** 🎉

---

## Phase 4: Deploy Recorder Service

The recorder service needs to run separately.

### Option A: Separate Coolify App (Recommended)

1. Create **New Application** in Coolify
2. Name: `radio-suite-recorder`
3. Same Git repo, same branch
4. **Environment Variables:**
   - Same `DATABASE_URL` as main app
   - Add: `SERVICE_TYPE=recorder`
5. **Build configuration:**
   - Create file: `nixpacks-recorder.toml`
   ```toml
   [phases.setup]
   nixPkgs = ['nodejs_20', 'ffmpeg-full']

   [start]
   cmd = 'npx tsx recorder-service.ts'
   ```
6. In Coolify, set build pack config to use `nixpacks-recorder.toml`
7. **Storage:** Mount SAME volumes as main app:
   - `/app/recordings` → same source as main app
   - `/app/uploads` → same source as main app
8. Deploy!

### Option B: Background Process in Main App (Simpler)

Use PM2 to run both processes in one container.

1. Install PM2:
   ```bash
   npm install pm2 --save
   ```

2. Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'web',
         script: 'npm',
         args: 'start',
       },
       {
         name: 'recorder',
         script: 'npx',
         args: 'tsx recorder-service.ts',
       },
     ],
   };
   ```

3. Update `nixpacks.toml`:
   ```toml
   [start]
   cmd = 'npx pm2-runtime start ecosystem.config.js'
   ```

4. Redeploy!

---

## Phase 5: Post-Deployment Checklist

### Verify Everything Works

- [ ] App loads at public URL
- [ ] Can create shows
- [ ] Can upload images
- [ ] Schedule saves correctly
- [ ] RSS feed accessible at public URL
- [ ] Validate RSS feed at https://validator.w3.org/feed/
- [ ] Test recording (if recorder deployed)
- [ ] Check recordings appear in database
- [ ] Episodes publish correctly
- [ ] Audio playback works

### Set Up Monitoring

1. In Coolify, enable **"Health Checks"**:
   - Path: `/`
   - Interval: `30s`

2. Check logs regularly:
   - Coolify → Your App → Logs
   - Watch for errors

### Backup Strategy

1. **Database Backups:**
   - Coolify auto-backs up PostgreSQL daily
   - Manual backup: `pg_dump` command in PostgreSQL terminal

2. **File Backups:**
   - Set up periodic backup of `/recordings` volume
   - Consider moving to S3/R2 later

---

## Troubleshooting

### Build Fails

**Check:**
- Is `nixpacks.toml` in root directory?
- Did you commit and push it?
- Are all dependencies in `package.json`?

**Fix:** Check build logs in Coolify for specific error

### Database Connection Error

**Check:**
- Is `DATABASE_URL` set correctly in environment variables?
- Is PostgreSQL service running?
- Can you connect from terminal?

**Fix:** Copy connection string again from PostgreSQL resource

### Recordings Not Persisting

**Check:**
- Are persistent volumes mounted?
- Is recorder service running?

**Fix:** Verify volume mounts in Coolify storage settings

### FFmpeg Not Found

**Check:**
- Is `nixpacks.toml` correct?
- Does it include `ffmpeg-full`?

**Fix:** Update `nixpacks.toml`, commit, redeploy

---

## Rollback Plan

If something goes wrong:

### Quick Rollback

1. In Coolify, click **"Deployments"**
2. Click previous successful deployment
3. Click **"Redeploy"**

### Full Rollback to SQLite

1. Revert schema change:
   ```diff
   - provider = "postgresql"
   + provider = "sqlite"
   ```
2. Change `DATABASE_URL` back to `file:./dev.db`
3. Redeploy

---

## Cost Estimate

**Coolify Resources:**
- PostgreSQL (16): ~$5-10/month
- App instance: ~$5-10/month
- Recorder service: ~$5/month
- Storage (50GB): ~$2/month

**Total:** ~$17-27/month (varies by provider/region)

---

## Summary

1. ✅ **Test locally** with PostgreSQL (optional)
2. ✅ **Update schema** to use PostgreSQL
3. ✅ **Create config files** (nixpacks.toml, etc.)
4. ✅ **Provision PostgreSQL** in Coolify
5. ✅ **Deploy main app** with environment variables
6. ✅ **Run migrations** via terminal
7. ✅ **Deploy recorder service** separately or with PM2
8. ✅ **Test everything** works
9. ✅ **Validate RSS feed** with public URL
10. ✅ **Celebrate!** 🎉

You're ready to go live! 🚀

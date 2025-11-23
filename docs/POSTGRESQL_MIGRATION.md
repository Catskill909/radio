# PostgreSQL Migration Guide - Radio Suite

Complete step-by-step guide to migrate from SQLite to PostgreSQL for production deployment.

---

## 🎯 Environment Strategy

You have two choices for your database setup. **Option 2 is what you asked for** (maximum consistency).

### Option 1: Hybrid (Easiest)
- **Local:** SQLite (Zero setup, just works)
- **Prod:** PostgreSQL (Robust, scalable)
- **Pros:** No need to install Postgres locally.
- **Cons:** Slight differences between dev and prod.

### Option 2: Unified (Best Parity) 🌟
- **Local:** PostgreSQL
- **Prod:** PostgreSQL
- **Pros:** **Exact match** between dev and prod. No "it works on my machine" bugs.
- **Cons:** You must install PostgreSQL on your Mac.

### How to do Option 2 (Unified)

1. **Install Postgres locally** (e.g., [Postgres.app](https://postgresapp.com/) or `brew install postgresql`).
2. **Update `.env` locally:**
   ```env
   DATABASE_URL="postgresql://paulhenshaw@localhost:5432/radio_suite_dev"
   ```
3. **Update `schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

**Result:** You run the **exact same** database engine everywhere. 🚀

---

## 🏗️ Architecture Overview

## 🏗️ Architecture Overview

Here is how your "Portable Package" fits with the database in both environments:

### 1. Local (Your Mac)
Everything runs directly on your machine. Simplicity is key.
```mermaid
graph TD
    A[Your Mac] --> B[Web App + Recorder]
    B --> C[(SQLite File dev.db)]
```

### 2. Production (Coolify)
Your App and Recorder run together in one container (The Portable Package), connecting to a robust managed database.
```mermaid
graph TD
    subgraph Coolify_Server
        D[Portable Package Container]
        E[(PostgreSQL Database)]
    end
    
    D -- Web App + Recorder (PM2) --> D
    D -- Connects via URL --> E
```

**Why separate the DB in production?**
- **Safety:** If your app crashes, your data is safe in the separate DB.
- **Backups:** Coolify automatically backs up the PostgreSQL container.
- **Performance:** PostgreSQL handles heavy traffic better than a file.

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
cmds = ['npm install', 'npm install pm2 -g']

[phases.build]
cmds = ['npx prisma generate', 'npm run build']

[start]
cmd = 'pm2-runtime start ecosystem.config.js'
```

Commit this file:
```bash
git add nixpacks.toml
git commit -m "Add Nixpacks config for FFmpeg and PM2"
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

## Phase 4: The "Portable Package" (Web + Recorder)

We use **PM2** to run both the website and the recorder in the **same container**. This mirrors your local development setup and keeps everything in one place.

### 1. Create `ecosystem.config.js`

**File:** `ecosystem.config.js` (NEW in project root)

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

### 2. Why this is better for you:
- **One Service:** You only manage one "App" in Coolify.
- **Shared Storage:** The recorder writes to `/recordings` and the website reads from it instantly. No complex networking needed.
- **Mirrors Local:** It works exactly like `npm run dev` (which runs both), but production-ready.

**Note:** We already configured `nixpacks.toml` in Phase 3 to use this file automatically! ✅

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

# Coolify/Nixpacks Deployment Audit - Radio Suite

## Executive Summary

**Deployment Readiness: ⚠️ 70% Ready - Needs Configuration**

Your app CAN deploy to Coolify with Nixpacks, but needs environment setup and some adjustments for production.

---

## Current Setup Analysis

### ✅ What's Ready

1. **Next.js 16.0.3** - Modern, supports production builds
   - `npm run build` ✅ exists
   - `npm run start` ✅ exists
   
2. **Package.json** - Clean structure
   - All dependencies listed
   - Build scripts configured
   
3. **Prisma ORM** - Database ready
   - Schema defined
   - Migration system in place
   
4. **Git Ready**
   - `.gitignore` properly configured
   - Database files excluded
   - `.env` excluded

5. **FFmpeg Dependency** - Listed but needs system install

---

## ⚠️ Issues to Address

### 1. **Database Strategy** (CRITICAL)

**Current:** SQLite (`dev.db`) - file-based database

**Problem:** SQLite files don't persist well in containerized deployments

**Solutions:**
- **Option A:** PostgreSQL (recommended for production)
  - Coolify can provision PostgreSQL easily
  - Requires Prisma schema change
  - More scalable
  
- **Option B:** Persistent volumes for SQLite
  - Coolify needs volume mount for `/prisma` directory
  - Less ideal for scaling
  
- **Option C:** Use Turso (serverless SQLite)
  - LibSQL compatible
  - Edge hosting
  - Requires connection string

**Recommendation:** Switch to PostgreSQL for production

---

### 2. **File Storage** (CRITICAL)

**Current:** Local file system storage for:
- `/recordings` - Audio files
- `/uploads` - Show images
- `/station-settings.json` - Config file

**Problem:** Container restarts will wipe these files

**Solutions:**
- **Option A:** Persistent volumes
  - Mount `/recordings` and `/uploads` to persistent storage
  - Coolify supports volume mounts
  
- **Option B:** S3/Object storage (recommended)
  - Store recordings in Cloudflare R2, AWS S3, or similar
  - Store images in object storage
  - Requires code changes
  
- **Option C:** Mix both
  - Settings in environment variables
  - Media in object storage

**Recommendation:** Plan for S3/R2 migration eventually

---

### 3. **Environment Variables** (REQUIRED)

**Missing:** `.env.example` file

**Current `.env` (excluded from git):**
```env
DATABASE_URL="file:./dev.db"  # Needs production URL
# Missing:
# - NEXT_PUBLIC_BASE_URL
# - Object storage keys (if using)
# - Any API keys
```

**Needed for Coolify:**
- `DATABASE_URL` - Production database connection
- `NEXT_PUBLIC_BASE_URL` - Your public domain
- `NODE_ENV=production`
- Storage credentials (if applicable)

---

### 4. **Recorder Service** (CRITICAL)

**Current:** `recorder-service.ts` runs via `concurrently` in dev

**Problem:** Production needs separate process

**Solutions:**
- **Option A:** Run as separate service in Coolify
  - Two deployments: web + recorder
  - Shared database
  
- **Option B:** Background job within same container
  - Use PM2 or similar process manager
  - Single deployment
  
- **Option C:** Serverless cron job
  - Separate Lambda/Edge function
  - Triggers periodically

**Recommendation:** Separate service deployment in Coolify

---

### 5. **FFmpeg Dependency** (REQUIRED)

**Current:** System dependency, not in package.json

**Nixpacks:** May not install FFmpeg by default

**Solution:** Create `nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ['nodejs', 'ffmpeg']

[phases.build]
cmds = ['npm install', 'npx prisma generate', 'npm run build']

[start]
cmd = 'npm start'
```

---

### 6. **Build Configuration**

**Missing:**
- No `Dockerfile` (Nixpacks will generate)
- No `.dockerignore` (should create)
- No `nixpacks.toml` (recommended)

**Current build script:** ✅ `next build`

**Prisma:** Needs `prisma generate` in build

---

## 📋 Pre-Deployment Checklist

### Must Do Before Deploy

- [ ] **Choose database strategy**
  - PostgreSQL URL ready?
  - Update `DATABASE_URL` in Coolify
  
- [ ] **Set up persistent storage**
  - Configure volume mounts in Coolify for `/recordings` and `/uploads`
  - OR set up S3/R2 bucket
  
- [ ] **Create `.env.example`**
  ```env
  DATABASE_URL=
  NEXT_PUBLIC_BASE_URL=
  NODE_ENV=production
  ```

- [ ] **Update package.json build**
  ```json
  "build": "prisma generate && next build"
  ```

- [ ] **Create `nixpacks.toml`** (for FFmpeg)

- [ ] **Create `.dockerignore`**
  ```
  node_modules
  .next
  recordings/*
  uploads/*
  *.db
  .env.local
  ```

- [ ] **Plan recorder service deployment**
  - Separate Coolify app?
  - Same container with PM2?

- [ ] **Test production build locally**
  ```bash
  npm run build
  npm start
  ```

---

## Nixpacks Detection

Nixpacks will auto-detect:
- ✅ Node.js (via `package.json`)
- ✅ Next.js (via dependencies)
- ❌ FFmpeg (needs `nixpacks.toml`)
- ⚠️ Prisma (needs `prisma generate` in build)

---

## Coolify Configuration

### Environment Variables to Set:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NODE_ENV=production
```

### Volume Mounts Needed:

```
/app/recordings -> persistent volume
/app/uploads -> persistent volume  
/app/prisma/dev.db -> (if using SQLite)
```

### Ports:

- Web: `3000` (default Next.js)
- Recorder service: No port (background process)

---

## Deployment Steps (When Ready)

1. **Push to Git** (GitHub/GitLab)
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **In Coolify:**
   - Create new application
   - Connect Git repository
   - Set build pack: Nixpacks (auto-detected)
   - Add environment variables
   - Configure persistent volumes
   - Deploy!

3. **Post-Deploy:**
   - Run migrations: `npx prisma migrate deploy`
   - Start recorder service (separate app or PM2)
   - Test RSS feed with public URL
   - Upload test recording

---

## Risks & Warnings

🚨 **HIGH RISK:**
- File storage without persistent volumes = lost recordings
- Database without proper backup = lost show data
- Missing FFmpeg = recordings won't work

⚠️ **MEDIUM RISK:**
- Recorder service needs monitoring
- No health checks configured
- No automated backups

---

## Recommended Architecture

```
┌─────────────────────────────────────┐
│  Coolify (Primary Deployment)       │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Next.js App (Port 3000)    │  │
│  │   - Web UI                   │  │
│  │   - API Routes               │  │
│  │   - RSS Feeds                │  │
│  └──────────────────────────────┘  │
│           ↓                         │
│  ┌──────────────────────────────┐  │
│  │   PostgreSQL Database        │  │
│  │   (Coolify PostgreSQL addon) │  │
│  └──────────────────────────────┘  │
│           ↓                         │
│  ┌──────────────────────────────┐  │
│  │   Persistent Volumes         │  │
│  │   - /recordings              │  │
│  │   - /uploads                 │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Coolify (Recorder Service)         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   recorder-service.ts        │  │
│  │   - Monitors schedule        │  │
│  │   - Starts/stops recordings  │  │
│  │   - Shares same DB & volumes │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Bottom Line

**Can you deploy to Coolify right now?**
- **Technically:** Yes, but it will break
- **Practically:** After 2-3 hours of prep work

**What breaks without prep:**
- Recordings won't persist (no volumes)
- Database won't persist (no PostgreSQL)
- FFmpeg might not work (no nixpacks.toml)
- Recorder service won't run (no separate deployment)

**Timeline:**
- **Quick & Dirty (1 hour):** Basic deploy with persistent volumes, might work
- **Proper Setup (3 hours):** PostgreSQL, volumes, recorder service
- **Production-Ready (1 day):** Add S3, monitoring, backups

---

## Next Steps

1. **Decide:** PostgreSQL or stick with SQLite + volumes?
2. **Decide:** Run recorder as separate Coolify app?
3. **Create:** Required config files (nixpacks.toml, .dockerignore, .env.example)
4. **Test:** Local production build
5. **Deploy:** Push and configure in Coolify

Want me to help you prepare these files?

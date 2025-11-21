# Prisma Standard Workflow Guide

## ⚠️ CRITICAL RULES - READ FIRST

1. **NEVER manually edit the database**
2. **ALWAYS run migrations after schema changes**
3. **Database files are NOT in git** (they're gitignored)
4. **Backups are created automatically**

---

## Making Schema Changes (THE RIGHT WAY)

### Step-by-Step Process

1. **Edit `prisma/schema.prisma`**
   - Add/modify your models
   - Save the file

2. **IMMEDIATELY run migration**
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
   
   Examples:
   ```bash
   npx prisma migrate dev --name add_email_field
   npx prisma migrate dev --name add_user_table
   ```

3. **That's it!** Prisma will:
   - Create migration SQL
   - Apply it to your database
   - Regenerate the Prisma Client
   - Update TypeScript types

### What NOT to Do

❌ **DON'T** edit schema and forget to migrate
❌ **DON'T** run `prisma generate` alone (use `migrate dev`)
❌ **DON'T** manually run SQL commands
❌ **DON'T** commit database files to git

---

## Database Backups

### Automatic Backups

Before any risky operation, create a backup:

```bash
# Create timestamped backup
npm run db:backup

# Or manually:
cp prisma/dev.db prisma/dev.db.backup_$(date +%Y%m%d_%H%M%S)
```

### Restore from Backup

```bash
# List backups
ls -lh prisma/*.backup_*

# Restore (replace TIMESTAMP with actual timestamp)
cp prisma/dev.db.backup_TIMESTAMP prisma/dev.db
```

---

## Common Tasks

### Reset Database (DANGEROUS - deletes all data)

```bash
npx prisma migrate reset
```

### View Database Contents

```bash
npx prisma studio
```
Opens a web UI at http://localhost:5555

### Check Migration Status

```bash
npx prisma migrate status
```

---

## Emergency Recovery

### If You Lost Data

1. **DON'T PANIC**
2. Check for backup files:
   ```bash
   ls -lh prisma/*.backup_*
   ls -lh prisma/*.SAFE_BACKUP_*
   ```

3. Restore most recent backup:
   ```bash
   cp prisma/dev.db.backup_TIMESTAMP prisma/dev.db
   ```

4. Run migrations to update schema:
   ```bash
   npx prisma migrate dev
   ```

### If Migrations Are Broken

```bash
# Mark all migrations as applied (use carefully!)
npx prisma migrate resolve --applied MIGRATION_NAME

# Or reset and start fresh (DELETES DATA)
npx prisma migrate reset
```

---

## Development Workflow

### Starting Work

```bash
npm run dev
```

### After Pulling Changes

```bash
# Apply any new migrations
npx prisma migrate dev

# Restart dev server
npm run dev
```

### Before Committing

```bash
# Check what's changed
git status

# Database files should NOT appear
# Only commit:
# - prisma/schema.prisma
# - prisma/migrations/*
```

---

## Troubleshooting

### "Database is out of sync"

```bash
npx prisma migrate dev
```

### "Type errors after schema change"

```bash
npx prisma generate
```

### "Can't delete/update records"

Check for foreign key constraints. Use Prisma Studio to inspect relationships.

### "Migration failed"

1. Check the error message
2. Fix the schema issue
3. Run `npx prisma migrate dev` again
4. If stuck, restore from backup and try again

---

## NPM Scripts (Recommended)

Add these to `package.json`:

```json
{
  "scripts": {
    "db:backup": "cp prisma/dev.db prisma/dev.db.backup_$(date +%Y%m%d_%H%M%S)",
    "db:studio": "npx prisma studio",
    "db:migrate": "npx prisma migrate dev",
    "db:reset": "npx prisma migrate reset"
  }
}
```

Then use:
```bash
npm run db:backup
npm run db:studio
npm run db:migrate
```

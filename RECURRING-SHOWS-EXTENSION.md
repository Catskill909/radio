# Recurring Shows Auto-Extension

## Overview

Radio shows run indefinitely, but we only generate 52 weeks of schedule slots at a time to keep the database manageable. The system **automatically extends** recurring shows before they end.

## ✨ Automatic Extension (Built-in)

**The recorder service automatically extends shows every 24 hours** - you don't need to do anything!

When the recorder service runs (which starts with `npm run dev`), it:
- ✅ Checks every 24 hours for shows ending within 4 weeks
- ✅ Automatically extends them by 52 more weeks
- ✅ Logs what it extended in the console
- ✅ Runs forever as long as your app is running

**You never need to think about this.** Your 24-year show will keep getting extended automatically.

## How It Works

1. **Finds recurring shows** that end within the next 4 weeks
2. **Extends them** by another 52 weeks (1 year)
3. **Checks for overlaps** before creating new slots
4. **Logs everything** so you know what happened

## Usage

### Run Manually (Recommended)

Run this script whenever you want to extend shows:

```bash
npx tsx extend-recurring-shows.ts
```

**When to run**:
- Once a month is usually enough
- Or whenever you notice shows ending soon in the calendar
- After creating new recurring shows

### Example Output

```
🔍 Checking for recurring shows that need extension...

📺 Found 3 recurring show(s)

⚠️  "Morning Drive" ends soon: 12/15/2025
   Extending by 52 weeks...
   ✅ Extended to 12/14/2026 (+52 weeks)

✅ "Afternoon Show" - OK (38 weeks remaining)

✅ "Evening Mix" - OK (45 weeks remaining)

🎉 Successfully extended 1 show(s)

✨ Done!
```

## Automated Extension (Optional)

### Option 1: Cron Job (Mac/Linux)

Add to your crontab to run every Sunday at midnight:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your project)
0 0 * * 0 cd /Users/paulhenshaw/Desktop/radio-suite && npx tsx extend-recurring-shows.ts >> extend-shows.log 2>&1
```

### Option 2: npm Script

Add to `package.json`:

```json
{
  "scripts": {
    "extend-shows": "npx tsx extend-recurring-shows.ts"
  }
}
```

Then run: `npm run extend-shows`

## How Far Ahead Are Shows Scheduled?

- **New recurring shows**: 52 weeks (1 year) ahead
- **After extension**: Another 52 weeks added
- **Buffer zone**: Script runs when shows have < 4 weeks remaining

This means:
- Your 24-year show will keep getting extended automatically
- Database stays lean (only ~1 year of slots at a time)
- You can always run the script manually if needed

## Safety Features

- ✅ **Overlap detection** - Won't create slots that conflict with other shows
- ✅ **Preserves original timing** - Same day/time every week
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Logs everything** - You know exactly what changed

## Troubleshooting

**Q: What if I forget to run it?**
A: Shows just stop appearing in the calendar after 52 weeks. Run the script and they'll be extended immediately.

**Q: Can I extend more than 52 weeks at a time?**
A: Yes! Edit `extend-recurring-shows.ts` and change the `52` in the loop to `104` (2 years) or more.

**Q: What about shows that should end?**
A: Uncheck "Repeat Weekly" in the Edit Slot modal, or delete future slots manually.

**Q: Can I see what will be extended without actually doing it?**
A: Yes! Look at the console output - it shows which shows will be extended before creating slots.

## Best Practices

1. **Run monthly** - Set a calendar reminder
2. **Check after creating new recurring shows** - Make sure they extended properly
3. **Monitor the logs** - Watch for overlap warnings
4. **Keep backups** - Run `npm run db:backup` before major operations

## Future Enhancements

We could add:
- Automatic daily/weekly execution via the recorder service
- Email notifications when shows are extended
- Dashboard showing how far ahead each show is scheduled
- Bulk extension controls in the UI

For now, manual execution keeps it simple and gives you full control.

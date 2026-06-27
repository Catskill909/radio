#!/usr/bin/env bash
#
# Master local DST test runner.
#   ./test-dst-all.sh            run everything (logic + DB-backed tests)
#   ./test-dst-all.sh --logic    run only DB-free logic tests (no dev.db touched)
#
# Safety: backs up prisma/dev.db before any DB-backed test. The DB-backed tests
# create a clearly-named temporary show + slots and delete them on completion.
#
# No browser automation (per README): this is terminal-only.

set -uo pipefail
cd "$(dirname "$0")"

LOGIC_ONLY=0
[[ "${1:-}" == "--logic" ]] && LOGIC_ONLY=1

pass=0; fail=0; results=()

run() {
    local name="$1"; shift
    echo ""
    echo "──────────────────────────────────────────────"
    echo "▶ $name"
    echo "──────────────────────────────────────────────"
    if "$@"; then results+=("✅ $name"); ((pass++)); else results+=("❌ $name"); ((fail++)); fi
}

# 1. TypeScript compile check (catches type regressions in the changed files).
run "tsc --noEmit (type check)" npx tsc --noEmit

# 2. DB-free logic tests — always safe.
run "transition helper (lib/dst.ts)"        npx tsx test-dst-transition.ts
run "extend logic (DST-safe slot math)"     npx tsx test-dst-extend.ts
run "recurring series grouping"             npx tsx test-recurring-series.ts
run "recurring generation (read-only)"      npx tsx test-dst-recurring.ts

# 3. DB-backed tests — back up first, then run (each self-cleans).
if [[ "$LOGIC_ONLY" -eq 0 ]]; then
    if [[ -f prisma/dev.db ]]; then
        backup="prisma/dev.db.backup_$(date +%Y%m%d_%H%M%S)"
        cp prisma/dev.db "$backup"
        echo ""; echo "🛟 DB backed up → $backup"
    else
        echo ""; echo "⚠️  prisma/dev.db not found — skipping DB-backed tests."
        LOGIC_ONLY=1
    fi
fi

if [[ "$LOGIC_ONLY" -eq 0 ]]; then
    run "comprehensive suite (DB, self-cleaning)" npx tsx test-comprehensive.ts
    run "automated DST (DB, self-cleaning)"       npx tsx test-dst-automated.ts
fi

# Summary
echo ""
echo "══════════════════════════════════════════════"
echo "  DST LOCAL TEST SUMMARY"
echo "══════════════════════════════════════════════"
for r in "${results[@]}"; do echo "  $r"; done
echo "──────────────────────────────────────────────"
echo "  $pass passed, $fail failed"
echo "══════════════════════════════════════════════"
[[ "$fail" -eq 0 ]] && exit 0 || exit 1

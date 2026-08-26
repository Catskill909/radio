# AI Scheduler — Standalone Build Plan

**Created:** August 24, 2026

**Companion Doc:** `AI-SCHEDULING-SPEC.md` (product/design blueprint — all its rules apply here)

**Project Location:** `~/Desktop/ai-scheduler` (new sibling repo)

**End Goal:** Every module built here inserts into radio-suite with minimal adaptation.

**Current Status:** Phases 0–2 foundations complete; Phase 3A experience design in
progress; no radio-suite application code integrated.

---

## 1. Why Standalone-First

Build the AI scheduling system in a clean-room app that **mirrors radio-suite's stack and data model exactly**, so that when it's proven, integration is a copy-and-wire job — not a rewrite.

Benefits:
- Zero risk to the live station (`radio.supersoul.top`) during development
- Fast iteration without touching production schema
- Forces clean module boundaries (nothing can secretly depend on radio-suite internals)
- The schedule display views get built against the same JSON contract radio-suite's public API already emits

---

## 2. Portability Contract (Non-Negotiable)

Everything in the standalone app follows these rules so insertion into radio-suite is mechanical:

### 2.1 Mirror the Stack

| Layer | Choice | Matches radio-suite |
|-------|--------|---------------------|
| Framework | Next.js 16 (App Router) | ✓ |
| UI | React 19 + Tailwind + Lucide | ✓ |
| DB | Prisma + SQLite | ✓ |
| Dates | `date-fns` v4 + `date-fns-tz` v3 | ✓ |
| Calendar (admin) | `react-big-calendar` + dateFnsLocalizer | ✓ |
| Server logic | Server Actions (`app/actions.ts` pattern) | ✓ |

### 2.2 Mirror the Schema Subset

Use **identical field names** to radio-suite's Prisma models so queries port verbatim:

```prisma
model Show {
  id                     String   @id @default(uuid())
  title                  String
  type                   String?  // UPGRADED editorial type; transitional null allowed
  origin                 String?  // NEW: Local | Syndicated
  defaultDurationMinutes Int      @default(60) // NEW; required typical length
  recordingRetentionDays Int?     // NEW: null inherits station/type policy
  recordingEnabled       Boolean  @default(false)
  // ... same subset of fields as radio-suite
}

model ScheduleSlot {
  id                String    @id @default(uuid())
  showId            String
  startTime         DateTime  // UTC — same convention
  endTime           DateTime  // UTC
  isRecurring       Boolean
  recurringGroupId  String?
  splitGroupId      String?
  splitPosition     String?
  recordingOverride Boolean?
  // NEW (built here, ported to radio-suite in integration):
  status            String    @default("ACTIVE") // ACTIVE | SUPPRESSED | REPLACED | MOVED | CANCELLED
  overrideOfSlotId  String?   // links a replacement to the slot it overrides
  createdAt         DateTime  @default(now()) // NEW: ChangeSet snapshot
  updatedAt         DateTime  @updatedAt      // NEW: optimistic Undo check
}
```

### 2.3 Mirror the Timezone Discipline

Adopt radio-suite's proven DST-aware pattern wholesale (see `docs/daylight-savings.md`):
- UTC in DB, station-time at the edges
- `toZonedTime → add → format → fromZonedTime` for recurrence generation
- Copy `lib/station-time.ts` as-is into the standalone app

### 2.4 Portable Module Boundaries

```
ai-scheduler/
├── lib/
│   ├── scheduling/        # PORTABLE — deterministic core (pure functions + Prisma)
│   │   ├── slots.ts       #   create/move/suppress slot operations
│   │   ├── conflicts.ts   #   overlap detection (port of checkSlotOverlap)
│   │   ├── recurrence.ts  #   DST-aware series generation
│   │   ├── overrides.ts   #   exception/override logic (NEW)
│   │   └── changesets.ts  #   atomic apply + undo (NEW)
│   ├── ai/                # PORTABLE — provider-agnostic AI layer
│   │   ├── provider.ts    #   interface: interpret(request, context) → StructuredIntent
│   │   ├── providers/     #   gemini.ts (V1) — openai.ts, anthropic.ts, openrouter.ts later
│   │   ├── keys.ts        #   provider key management (DB-stored, per-provider)
│   │   ├── intent.ts      #   StructuredIntent types + zod validation
│   │   └── commands.ts    #   constrained command layer (inspect/preview/apply/undo)
│   └── station-time.ts    # COPIED from radio-suite verbatim
├── components/
│   ├── schedule-views/    # PORTABLE — front-user display variety (NEW REQUIREMENT)
│   │   ├── WeekGridView.tsx
│   │   ├── DayListView.tsx
│   │   ├── AgendaView.tsx
│   │   ├── NowNextStrip.tsx
│   │   ├── MonthOverview.tsx
│   │   └── ScheduleViewSwitcher.tsx
│   └── ai-chat/           # PORTABLE — the assistant UI
│       ├── AiSchedulerPanel.tsx
│       ├── ImpactPreview.tsx
│       └── ChangeHistory.tsx
└── app/                   # NOT portable — thin standalone shell (pages, seed admin)
```

**Rule:** Nothing in `lib/` or `components/schedule-views/` or `components/ai-chat/` may import from `app/`. All portable code consumes:
- Prisma client (same models)
- A normalized schedule JSON contract (identical shape to radio-suite's `/api/public/schedule` response)
- Station settings via a small interface (so radio-suite's `getStationSettings` slots in)

### 2.5 Canonical Show Categories

`radio-suite/lib/itunes-categories.ts` is authoritative. The standalone project
keeps a compatibility copy with the same 19 Apple Podcasts categories,
subcategories, helper behavior, and `Category > Subcategory` storage format.

When both repositories are present, the standalone test suite compares the full
taxonomy against the mother-app module. UI code must use this taxonomy rather than
derive ad hoc category choices from seed data.

### 2.6 Planned Show Length

`Show.defaultDurationMinutes` is the required typical or planned length and is
at least 30 minutes in the current standalone core. It is not the authoritative
duration of every scheduled occurrence; `ScheduleSlot.startTime` and `endTime`
remain authoritative for an airing. A mismatch is allowed with a visible warning
and operator confirmation. Programs under 30 minutes are deferred until the core
schedule experience can assess calendar, recurrence, conflict, recording, and
integration complexity.

StationDock's current `createShow` form accepts a `duration` value only to compute
the first slot's end time, and `lib/schedule-errors.ts` still mentions a 15-minute
minimum. Phase 7 must migrate that behavior and copy deliberately; recording and
episode `duration` fields are unrelated and must not be repurposed.

The current standalone number input is not the final UX. Phase 3A validates one
shared, unit-bearing selector for quick entry and Show Details: readable common
choices (`30 minutes`, `1 hour`, `1 hour 30 minutes`, `2 hours`, and longer radio
blocks) plus a clearly labeled custom value. A compact select/combobox is favored
over a modal unless future advanced timing rules justify one. Storage remains
integer minutes and the sub-30-minute product decision remains deferred.

### 2.7 Show Type, Origin, and Music Retention Upgrade

Integration may improve the existing model rather than preserve mixed legacy
labels. Editorial show type becomes `Public Affairs`, `News`, `Music`, `Arts &
Culture`, `Health`, or `Special Broadcast`. `Local`/`Syndicated` is preserved separately as optional
origin. Neither becomes a sixth schedule-readiness field.

Legacy Local/Syndicated Music maps to editorial Music plus origin. Legacy
Local/Syndicated Podcast preserves origin but requires staff classification; the
migration must not guess an editorial type from podcast format or Apple category.

`Special Broadcast` covers live and exceptional programming. A custom dated
replacement carries the selected occurrence date, start, and duration into a
one-time draft, then applies as a linked replacement exception without rewriting
the recurring baseline.

For Pacifica, selecting Music visibly inherits a default 14-day completed-
recording retention policy. This does not enable recording. The policy is
overridable per show and must use elapsed time rather than approximating two weeks
with `feedEpisodeLimit = 2`; feed visibility and audio retention remain separate.

---

## 3. NEW: Front-User Schedule Display Variety

Radio-suite currently has one public display (the `/listen` day-list). This project builds a **library of interchangeable schedule views**, with an admin setting to choose which one(s) the public sees.

### 3.1 View Catalog (V1)

| View | Description | Ports to radio-suite as |
|------|-------------|------------------------|
| **Day List** | Vertical card list for one day (current `/listen` style) | Drop-in replacement/upgrade of `DailySchedule` |
| **Week Grid** | 7-column hour grid (like the existing `CalendarGrid` but polished, responsive) | Replaces/extends `CalendarGrid.tsx` |
| **Agenda** | Continuous scrolling timeline, "up next" oriented, groups by day | New view for `/listen` |
| **Now + Next Strip** | Compact horizontal widget: current show, progress bar, next 3 shows | Embeddable on any page / homepage hero |
| **Month Overview** | Month grid with show-type color density (which days have specials) | New view, links into day view |

### 3.2 Common Contract

Every view consumes the **same normalized props** — exactly what radio-suite's public API returns:

```ts
interface ScheduleViewProps {
  slots: PublicScheduleSlot[]   // { id, startTime: ISO-UTC, endTime, show: {...} }
  stationTimezone: string        // IANA string
  displayTimezone: 'station' | 'visitor'  // admin choice
  nowPlaying?: NowPlayingData
  onShowClick?: (showId: string) => void
}
```

### 3.3 Admin Controls

A settings section (portable to radio-suite's `/settings`):
- **Default public view** — which view renders on the public schedule page
- **Visitor toggle** — allow/disallow visitors to switch views themselves
- **Timezone display mode** — station time vs visitor local time (with label, per the DST audit recommendation)

---

## 4. Phase Plan

### Phase 0 — Scaffold (complete)
- `create-next-app` in `~/Desktop/ai-scheduler`, mirror stack versions from radio-suite's `package.json`
- Prisma schema (subset above), seed script with a realistic weekly schedule (recurring shows, a split midnight show, shows near DST boundaries)
- Copy `lib/station-time.ts` + `station-settings.json` pattern
- **Exit criteria:** seeded schedule renders in a basic list; `npm run build` passes

### Phase 1 — Deterministic Scheduling Core (complete)
- Port `checkSlotOverlap`, slot creation, DST-aware recurrence generation from radio-suite `app/actions.ts` into `lib/scheduling/` as **pure, tested functions**
- Unit tests: overlap matrix, DST fall-back + spring-forward recurrence (leverage scenarios from `docs/daylight-savings.md`), midnight-split slots
- **Exit criteria:** test suite green, including DST boundary cases
- *Side benefit: this refactor is itself portable — radio-suite's inline action logic becomes a shared lib*

### Phase 2 — Overrides, Change Sets, Undo (complete foundations)
- `status` field + override semantics: SUPPRESSED / REPLACED / MOVED / CANCELLED
- Gap-filling logic must skip intentionally-overridden occurrences (the spec's "missing accidentally vs intentionally overridden" rule)
- `ChangeSet` model: who/when/what, before/after state, atomic apply via Prisma transactions, undo
- **Exit criteria:** create a temporary override → auto-extend does NOT resurrect it → undo restores original state

The portable layer meets the exit criteria. Operator-facing apply/Undo wiring is
later UI/integration work.

### Phase 3A — Schedule Experience Design Gate (in progress)

- Research modern 24/7 radio and general calendar/scheduler displays.
- Separate the dense operator calendar from the editorial listener schedule while
  retaining one normalized data contract.
- Validate dark/light/system presentation, responsive layouts, station-time
  labels, 24/7 coverage gaps, midnight continuation, DST-week behavior,
  replacement, recording consequence, impact preview, and Undo states.
- Guide schedule completion deterministically: 24/7 coverage plus required show
  name, host, typical length of at least 30 minutes, time, and category; optional
  metadata never blocks readiness.
- Keep typical show length separate from occurrence duration. A shorter or longer
  placement receives a confirmable warning, while sub-30-minute scheduling is
  deferred.
- Validate the shared unit-bearing duration selector, with common readable
  choices and a custom path that never hides its unit.
- Keep calendar and assistant in context together. The operator assistant uses a
  right-side panel that collapses horizontally into a persistent right rail.
- Use a compact global top bar for show/settings navigation and primary actions;
  do not duplicate the visible Schedule and Assistant surfaces in a permanent
  left rail or stack redundant headings above readiness.
- Let a pointer select an exact 30-minute start within open airtime, derive the
  tentative end from typical show length without crossing booked time, and mirror
  the selected start in a keyboard-accessible assistant time control.
- Carry that selected station-local date/day/time into `Create a new show
  instead`, prefill its first pattern, and retain it through show review. Global
  Add Show remains blank because it has no placement context.
- Keep optional artwork in quick show entry. Open the complete Show Details modal
  only on explicit request, with one synchronized draft and clearly separated
  listener, publishing, archive, contact, and recording sections.
- Prototype the six editorial show types separately from optional
  Local/Syndicated origin. Selecting Music at Pacifica shows an overridable
  14-day retention default without automatically enabling recording.
- Use honest pointer cues: precise selection for open airtime, inspection for
  scheduled shows, and a dedicated `grab`/`grabbing` handle only when safe move
  behavior exists, always with a non-drag alternative.
- Prototype a separate bottom-edge `ns-resize` handle with a ghost boundary and
  live assistant time/duration/conflict/recording feedback. It changes the
  occurrence only unless recurring scope is explicitly chosen, and has an
  equivalent end-time/keyboard workflow.
- **Current checkpoint:** data-backed operator prototype running with a no-write
  structured proposal flow, 24/7 readiness, exact time selection, typical-duration
  guidance, compact top-bar shell, themes, searchable Help Center, optional
  quick-entry artwork, the explicit Show Details modal, and a no-write weekly /
  alternating / limited-run / one-time pattern chooser, contextual new-show
  review, scoped airtime removal, and shared unit-bearing duration entry. No-write
  Move, Replace, and bottom-edge Resize show logical duration, explicit scope,
  visible-week conflicts, and recording consequences with pointer/keyboard parity.
  The 54-test suite passes; listener wireframes, applied write states, pattern
  persistence, and formal accessibility review are still open.
- **Exit criteria:** approved operator/listener wireframes, tokenized themes,
  accessibility/device review, and no unresolved DST/midnight/override display
  rule.

### Phase 3B — Schedule Display Views (3–4 days)
- Build the 5 views against the common contract, responsive, station/visitor timezone modes
- `ScheduleViewSwitcher` + admin default-view setting
- **Exit criteria:** all views render the seed schedule correctly, including the midnight-split and DST-week data

### Phase 3C — Write-Capable Operator Scheduling

- Add/Edit Show uses a full Show Details surface: name, host, category, typical
  length, and airtime are required; StationDock-compatible profile fields remain
  optional and progressively disclosed.
- Use the same approved duration selector in quick entry and Show Details. Persist
  editorial type, optional origin, station retention default, and show override
  through one typed Show adapter.
- Implement weekly, alternating-week, limited-run, and one-time patterns with
  explicit boundaries and multiple airtime/replay patterns per show. Alternating
  readiness audits the full repeating cycle.
- Calendar placement uses `Remove`: confirm one dated airing or every scheduled
  airing while retaining the show. Full Show Details separately owns `Delete
  show` and previews all attached airtime impact.
- Implement move and bottom-edge resize through deterministic validation and
  atomic ChangeSets. Pointer resize defaults to one occurrence; recurring scope
  requires explicit preview/confirmation, and all paths provide Undo.
- Manual preview/apply/Undo routes through the deterministic Phase 1/2 operations;
  it must work with no AI provider configured.
- Later AI requests reuse calendar context and deterministic facts, ask only for
  genuine ambiguity or missing consequences, and call these same operations.
- **Exit criteria:** persist, reload, and safely Undo a representative schedule
  built from an incomplete template through `Ready to air`.

### Phase 4 — AI Layer (3–5 days)
- **Provider interface first, Gemini implementation second.** The `AiProvider` interface (`interpret(request, context) → StructuredIntent`) is defined before any provider code — Gemini is just the first implementation behind it
- **Google Gemini** as the V1 provider (`lib/ai/providers/gemini.ts`) using the official `@google/genai` SDK, structured output mode (JSON schema) for reliable intent extraction
- **Multi-provider key management from day one:**
  - `AiProviderConfig` Prisma model: `{ provider, apiKey (encrypted at rest), model, isActive, priority }`
  - Settings UI: add/edit/test keys per provider, pick active provider + model — mirrors radio-suite's existing settings-form patterns so it ports into `/settings`
  - "Test key" button validates auth before saving (distinguishes bad key vs provider outage)
  - No hard-coded model names anywhere (spec §16)
- `StructuredIntent` types + zod validation — AI output is never trusted raw
- Constrained command layer: `inspect_schedule`, `check_conflicts`, `preview_change`, `apply_change`, `undo_change` — all calling the same Phase 1/2 operations proven through the Phase 3C manual workflow
- Provider health handling: distinguish bad key vs outage; feature degrades to manual-only
- **Exit criteria:** a natural-language request produces a validated intent + deterministic preview via Gemini, with zero DB writes until approval; a second provider stub proves the abstraction holds

### Phase 4b — Additional Providers (as needed, post-V1)
- Implement `openai.ts` / `anthropic.ts` / `openrouter.ts` against the same interface when wanted
- Each is an isolated file + a row in `AiProviderConfig` — no changes to scheduling or command code
- Optional fallback chain: if the active provider fails, try the next by `priority`

### Phase 5 — Vertical Slice: The Malcolm X Scenario (2–3 days)
- Chat panel UI: request → interpretation → impact preview (affected shows list) → recording question → confirm → apply → change history entry → undo
- **Exit criteria:** the spec's §4 scenario works end-to-end; regular programming resumes after the special; undo is clean

### Phase 6 — Time Changes (2–3 days)
- One-time move vs permanent recurring move (distinct intents, distinct previews)
- Conflict preview when moving into occupied time
- **Exit criteria:** spec §6 scenarios + undo for both

### Phase 7 — Integration Playbook (1–2 days, documentation + dry run)
- Written migration guide: schema additions (`defaultDurationMinutes`, `status`,
  `overrideOfSlotId`, slot timestamps, `ChangeSet`, editorial type/origin, and
  recording-retention settings), complete Show-field adapter, file copy map, and
  wiring points in radio-suite actions, public views, settings, and recorder.
- Upgrade legacy type data without guessing ambiguous podcast classifications;
  implement exact age-based Music cleanup independently of feed limits.
- Dry-run integration on a production-shaped radio-suite clone. Mount the new
  scheduler behind a feature flag while the old UI remains a rollback surface
  over the same mutation operations; never dual-write schedules.
- **Exit criteria:** documented, tested insertion path; recorder re-check behavior verified against live schedule changes (spec §9 edge case: schedule changed mid-recording)

---

## 5. Decision Points (resolve as we go)

| # | Decision | Options | When |
|---|----------|---------|------|
| 1 | ~~First AI provider~~ | **DECIDED: Google Gemini** (others added via the provider interface in Phase 4b) | ~~Phase 4 start~~ ✓ |
| 2 | ~~Chat UI placement in radio-suite~~ | **DECIDED: right-side panel on the operator schedule, collapsible into a persistent right rail** | ~~Phase 5~~ ✓ |
| 3 | Recorder re-check | Build a standalone mock only if it adds clear value; otherwise verify directly during radio-suite integration | Phase 7 |
| 4 | Visitor view-switching | On by default or admin-only | Phase 3B |
| 5 | Whether `ChangeSet` also wraps *manual* edits in radio-suite (spec §10 suggests yes, eventually) | Integration scope | Phase 7 |
| 6 | Sub-30-minute programs | Keep the current minimum or design smaller increments after the core workflow is proven | Phase 3C / integration |
| 7 | Alternating readiness horizon | Audit the full two-week cycle or a generalized least-common recurrence cycle | Phase 3A design |
| 8 | ~~Editorial show types~~ | **DECIDED:** Public Affairs, News, Music, Arts & Culture, Health, Special Broadcast; Local/Syndicated moves to origin | ~~Integration planning~~ ✓ |
| 9 | ~~Pacifica Music retention~~ | **DECIDED:** visible, overridable 14-day completed-recording retention default; independent of recording enablement/feed limits | ~~Integration planning~~ ✓ |

---

## 6. What This Plan Deliberately Excludes (per spec §2)

Onboarding, crawling, imports, PDF ingestion, metadata enrichment, AI copywriting. V1 = AI scheduling + display views only.

---

## 7. Estimated Timeline

The original ~3–4 week estimate remains directional and should be revisited after
Phase 3A because the approved scope now explicitly includes a write-capable manual
operator phase. Phases 0–2 are complete and Phase 3A is active. AI still enters
only after the deterministic foundations, experience/display gate, and manual
operation workflow, preserving the specification's "deterministic code before
AI" rule.

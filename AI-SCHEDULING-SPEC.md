# StationDock AI Scheduling — Development Brief

**Project:** StationDock

**Repository:** https://github.com/Catskill909/radio

**Purpose:** Add a natural-language AI scheduling assistant to the existing StationDock scheduler without replacing or weakening the current manual scheduling workflow.

**Implementation checkpoint:** Standalone Phases 0–2 foundations complete;
Phase 3A operator/listener experience design in progress in sibling
`ai-scheduler`; no StationDock application code integrated yet.

---

## 1. Core Product Principle

**Ease of use comes first.**

StationDock is used by radio station staff and volunteers. The goal is not to expose more technical controls. The goal is to let a user describe what they want in ordinary language while StationDock handles the complexity underneath.

A successful interaction should feel like:

> “We have Malcolm X special programming next week, Monday through Thursday, noon to 6.”

StationDock should interpret the request, inspect the real schedule, identify consequences, ask only the questions that matter, show what will happen, and then safely apply the change after approval.

### Guiding rule

**If normal deterministic code can do something reliably, normal code should do it.**

Use AI for:
- natural-language interpretation
- ambiguity
- understanding user intent
- turning conversational requests into structured scheduling proposals

Use ordinary application logic for:
- schedule calculations
- recurrence
- conflicts
- recording decisions
- validation
- persistence
- permissions
- database state
- Undo
- safety rules

AI must never bypass the existing scheduler or directly invent database changes.

---

## 2. V1 Scope

**V1 is AI scheduling only.**

Do **not** build:
- station onboarding
- website crawling
- schedule imports
- PDF / Word / spreadsheet ingestion
- show research
- metadata enrichment
- AI website editing
- AI-generated promotional copy

Those are possible future projects, but they are explicitly outside the first implementation.

The initial AI scheduling project should cover:

1. Creating special programming
2. Changing show times
3. One-time / temporary schedule changes
4. Permanent schedule changes
5. Conflict and preemption detection
6. Recording guardrails
7. Confirmation before consequential changes
8. Undo / change history
9. Recorder behavior when schedules change
10. Provider abstraction sufficient to avoid tying the feature permanently to one AI company

---

## 3. Existing StationDock Architecture Is the Authority

Before writing code:

1. Inspect the entire repository.
2. Trace the current show, scheduler, recurrence, conflict, recording, station settings, authentication/permissions, and alert systems.
3. Identify the existing functions/actions that should be reused.
4. Produce an implementation plan against the existing architecture.
5. Do not begin by creating a parallel scheduler.

The current scheduler already contains important radio-specific behavior. Preserve and extend it rather than duplicating it.

Relevant concepts already present in the application include:
- `Show`
- `ScheduleSlot`
- recurring schedule groups
- conflict validation
- station timezone handling
- recording configuration / overrides
- recurring-series extension
- SMTP / alert infrastructure
- station settings

The AI assistant should ultimately call controlled application operations that use these existing systems.

---

## 4. First Representative Use Case

The first end-to-end test case should be:

> “We have Malcolm X special programming next week, every day from noon to 6 Monday through Thursday.”

Expected behavior:

1. Parse the dates and times in the station timezone.
2. Recognize that this is temporary special programming.
3. Inspect the existing schedule during those periods.
4. Identify every scheduled occurrence that would be affected.
5. Do not make changes yet.
6. Present a concise impact preview.
7. Ask about recording if the request did not specify recording behavior.
8. Require confirmation.
9. Apply the temporary special without permanently modifying the normal recurring schedule.
10. Ensure the regular schedule automatically resumes afterward.
11. Record the operation in change history.
12. Provide Undo.

Example preview:

> **Malcolm X Special Programming**\
> Monday–Thursday, 12:00 PM–6:00 PM
>
> This will temporarily replace:
> - Monday 12–1 — Show A
> - Monday 1–2 — Show B
> - Tuesday 3–5 — Show C
> - …
>
> 17 scheduled program occurrences are affected.
>
> Regular recurring programming remains intact and resumes automatically afterward.
>
> Recording was not specified. Do you want to record the special?
>
> **Review affected shows / Continue / Cancel**

Keep the actual UI much simpler than the underlying implementation.

---

## 5. Temporary Overrides / Exceptions

This is a critical architectural requirement.

A temporary preemption must **not** be implemented by destructively changing the recurring show.

Example:

> “Replace Tuesday 3–5 PM next week with a special.”

The normal Tuesday 3–5 PM recurring show must remain part of the recurring schedule. Only that specific occurrence should be suppressed or overridden.

### Important existing behavior to inspect

StationDock has recurring-series extension / gap-filling logic.

A temporary occurrence must not simply be deleted if the recurring-series repair logic can later interpret the missing occurrence as a gap and recreate it.

Introduce or use a durable exception/override concept such as:

- `SUPPRESSED`
- `REPLACED`
- `MOVED`
- `CANCELLED`

The exact schema should follow the existing architecture after inspection.

The key requirement is:

**The system must be able to distinguish “missing accidentally” from “intentionally overridden.”**

---

## 6. Time Changes

Time changes are part of V1.

The assistant must distinguish between requests such as:

> “Move Bike Talk to 4:30 next Monday.”

and:

> “Move Bike Talk to 4:30 every Monday starting next week.”

These are different operations.

### Temporary move

Only the specified occurrence changes.

Future recurring occurrences retain the normal time.

### Permanent / future recurring move

The selected occurrence and the appropriate future recurring occurrences are changed using the existing recurring schedule logic.

Before applying either change:
- calculate the resulting slots
- detect overlaps/conflicts
- explain the consequences
- require confirmation where existing programming is displaced

---

## 7. Conflict / Preemption Guardrail

AI must never silently overwrite scheduled programming.

Any operation that:
- preempts a show
- moves a show into another show's time
- shortens an existing occurrence
- cancels programming
- replaces programming
- alters multiple future occurrences

must first produce an impact preview.

Example:

> **Schedule conflict**
>
> Tuesday 3–5 PM currently contains *The So-and-So Show*.
>
> Your requested special would replace that occurrence.
>
> **Continue / Modify Request / Cancel**

The scheduler/database—not the language model—should calculate the actual conflicts.

The AI explains the result in plain language.

---

## 8. Recording Guardrails

Recording is operationally important and must not be an afterthought.

If a new special or schedule operation does not specify recording behavior, StationDock should ask when the answer cannot safely be inferred from configured station rules.

Example:

> “Do you want StationDock to record this special?”

Possible future station policies may include:
- always record specials
- never record specials
- always ask
- inherit a default
- record regular shows by default
- special rules for fund drives or other program types

Do not overbuild these settings in the first pass. Reuse existing recording defaults where possible.

### Important principle

AI should not directly control the recorder.

AI changes the schedule through normal StationDock operations. The recorder reacts to the resulting schedule state.

---

## 9. Recorder Schedule Re-Check

Add or verify a deterministic recorder safeguard.

### Before starting a recording

Immediately before starting the next recording, re-read the current database schedule and confirm:

- the occurrence still exists
- the current time falls within its current scheduled start/end
- it has not been moved
- it has not been cancelled
- it has not been suppressed/preempted
- recording is still enabled
- no schedule override has changed what should be recorded

### While recording

Periodically re-check whether the active recording is still valid according to the current schedule.

The database schedule should remain the source of truth.

### Specific edge case to test

A show is scheduled 3:00–4:00 PM and is actively recording at 3:15 PM.

An operator changes it to 4:00–5:00 PM.

The recorder must recognize that the current time no longer falls within the newly scheduled occurrence and respond correctly rather than blindly continuing until the new end time.

Determine the desired behavior explicitly and test it.

The recorder should not rely on stale queued schedule information.

---

## 10. Undo / Change History

**Undo is a core safety feature.**

It exists for:
- AI mistakes
- human misunderstandings
- ordinary operator mistakes
- accidental schedule edits

Every consequential AI scheduling operation should be represented as a reversible change set.

Track enough information to restore the previous state safely.

A history entry should conceptually include:
- who initiated the change
- whether it came from AI-assisted or manual interaction
- timestamp
- user request / description
- affected records
- before state
- after state
- whether it can still be undone
- undo result

Example:

> **Recent Changes**
>
> 12:42 AM — Malcolm X Special added — AI-assisted — Undo\
> 12:30 AM — Bike Talk moved to 4:30 — Paul — Undo

Where practical, design the underlying change-history mechanism so manual scheduling changes can eventually benefit from the same safety system.

Prefer reversible state / soft suppression where appropriate rather than immediate destructive deletion.

---

## 11. Atomic Operations

AI-assisted schedule changes should behave like transactions:

**preview → approve → apply all or apply nothing → save Undo state**

Inspect current multi-slot update behavior.

Where an AI action affects multiple slots, avoid a state in which only part of the requested operation succeeds.

Use database transactions where appropriate.

This matters especially for:
- multi-day specials
- recurring time changes
- bulk preemptions
- Undo

---

## 12. AI Command Architecture

Do not give the model unrestricted database access.

Create a constrained internal command/action layer.

Conceptually:

- `inspect_schedule`
- `create_special`
- `move_occurrence`
- `move_recurring_show`
- `cancel_occurrence`
- `create_override`
- `check_conflicts`
- `preview_change`
- `apply_change`
- `undo_change`

These names are illustrative. Adapt them to the existing codebase rather than forcing a new naming system.

The model should output validated structured intent. StationDock decides whether and how that intent is allowed.

Example structured intent:

```json
{
  "operation": "create_special",
  "title": "Malcolm X Special Programming",
  "dates": [
    "2026-08-17",
    "2026-08-18",
    "2026-08-19",
    "2026-08-20"
  ],
  "startTime": "12:00",
  "endTime": "18:00",
  "recording": null,
  "scope": "temporary"
}
```

The application must validate everything before execution.

---

## 13. AI Should Ask Only Necessary Questions

Avoid turning the assistant into another complicated form.

Good:

> “Recording wasn't specified. Record this special?”

Bad:

> “Please configure title, schedule type, recurrence mode, recording mode, override behavior, archive rules, conflict strategy…”

If StationDock already knows something from:
- the user's command
- the current schedule
- station settings
- deterministic rules

do not ask the user again.

The assistant should surface only missing decisions that materially affect the result.

---

## 14. Confirmation Rules

Not every harmless action needs a frightening confirmation dialog.

However, confirmation is mandatory before AI applies a change that:
- replaces existing programming
- deletes/suppresses an occurrence
- changes multiple recurring occurrences
- changes recording behavior unexpectedly
- has unresolved ambiguity
- is otherwise destructive or difficult to notice

The confirmation should describe consequences in normal radio-station language.

Do not expose implementation jargon unless useful.

---

## 15. Manual Workflow Must Always Remain

The current manual scheduling interface remains the foundation.

AI is an accelerator, not a dependency.

If:
- the model is unavailable
- an API key fails
- quota is exhausted
- budget is reached
- the AI feature is disabled

the normal StationDock scheduler and recorder must continue operating normally.

Do not make core station operation dependent on an external AI provider.

---

## 16. Provider Abstraction

Avoid coupling StationDock directly to a single AI company.

Create a small provider interface so providers/models can change later.

Possible providers may eventually include:
- OpenAI
- Anthropic
- Google Gemini
- OpenRouter
- other compatible providers

Do not implement every provider unless needed for V1.

The important first step is architectural separation between:
- StationDock AI scheduling logic
- provider API implementation
- model configuration

Do not hard-code model names throughout the application.

---

## 17. Provider Health / Cost Safety

AI providers are a moving target.

Plan for:
- invalid/expired/replaced API keys
- authentication changes
- model retirement
- quota exhaustion
- rate limits
- provider outages
- API changes
- spending limits

StationDock should be able to distinguish a provider outage from an invalid key where possible.

The app already has SMTP/alert infrastructure and quota-style settings elsewhere. Reuse established patterns where sensible.

Possible future alerts:
- API authentication failed
- configured model unavailable
- 75% / 90% budget used
- budget exhausted
- provider failure persists

Again: **AI failure must never stop radio operations.**

---

## 18. UX Principle: Guardrails Without Clutter

Radio station staff and volunteers should not need to understand the machinery underneath.

Hide complexity unless it affects the user's decision.

The ideal flow is:

> Tell StationDock what you want.\
> StationDock checks the real schedule.\
> It asks only what it genuinely needs.\
> It shows consequences before changing anything.\
> The user approves.\
> The change is reversible.

A feature that adds more work than the manual process has failed.

Avoid adding settings simply because they are technically possible.

---

## 18A. Schedule Readiness and Guided Completion

The assistant also guides an operator through completing the station schedule.
This is a deterministic readiness workflow, not a separate onboarding, crawling,
import, or metadata-invention project.

### Ready to air

StationDock may describe its schedule setup as `Ready to air` only when:

- the configured baseline week has complete 24/7 active coverage;
- active occurrences have no invalid intervals or overlaps;
- every show in setup scope has a non-empty show name, host, scheduled time,
  category, and typical show length of at least 30 minutes.

Midnight-split rows count as one logical occurrence. Suppressed, replaced, moved,
or cancelled originals do not count as active airtime. DST transition weeks must
use their real 167- or 169-hour duration rather than synthetic 168-hour coverage.

`Ready to air` describes StationDock schedule completeness; it does not claim to
control or verify the audio stream itself.

### Required versus optional

Images, descriptions, tags, contact information, recording preferences, and other
profile enrichment are optional. Missing optional data must never revoke
readiness or be mixed into one vague completion score with operational blockers.

Category selection follows the existing canonical Apple Podcasts taxonomy in
`lib/itunes-categories.ts`. The operator selects a required category and may add
an optional subcategory; the existing stored form is `Category` or `Category >
Subcategory`.

Typical show length is a fifth required field. It describes the program's usual
length and must be stored separately from each occurrence's actual start/end
duration. A shorter or longer occurrence is permitted after the operator sees
both values and confirms the mismatch; for example, a two-hour show may
intentionally occupy a one-hour slot. The current standalone core blocks shows
and occurrences shorter than 30 minutes. Support for shorter programs is a
deferred core-product and integration decision, not an automatic rounding rule.
The existing `createShow` form's `duration` input currently controls its first
schedule occurrence only and is not a substitute for this new show-level field.
Integration must also reconcile legacy 15-minute validation guidance while
leaving recording and episode duration fields semantically unchanged.

### Guidance behavior

Deterministic application code supplies every coverage total, gap, conflict,
missing-field count, and affected-record preview. AI may explain and prioritize
those facts but must not guess them.

Guidance priority is:

1. invalid or conflicting time slots;
2. uncovered airtime;
3. missing required show information;
4. readiness confirmation;
5. optional enrichment.

The interface should show one recommended decision at a time, use structured
controls inside the conversation, preserve progress, and keep the calendar in
context. On the operator workspace, the assistant is a right-side panel that may
collapse horizontally into a persistent right rail. Optional details remain
behind progressive disclosure until required setup is complete.

While scheduling is a single focused workspace, do not add a permanent left rail
that duplicates the visible calendar and assistant. Put show navigation, settings,
and primary actions in the global top bar, and avoid stacking redundant workspace
eyebrows, page titles, and subtitles above readiness.

Dark and light presentation, keyboard access, screen-reader labels, zoom behavior,
and reduced-motion support are part of the design gate. Proposal UI must remain
visibly no-write until the user reaches an explicit impact preview and confirms a
validated operation.

---

## 19. Factual Assistance vs Creative AI

For this project, AI is primarily an interpreter of scheduling intent, not a creative writing system.

Future AI features should follow the same principle:
- factual extraction first
- report missing information
- do not invent factual metadata
- generation should be explicit and optional

This principle is included here because it reflects the intended product philosophy, but content generation is **not part of this V1 scheduling project**.

---

## 20. Testing Priorities

Automated tests are necessary, but scheduling/recording must also be tested against real clock behavior in the isolated clone.

High-priority scenarios:

### Special programming
- one-day special
- multi-day special
- special spanning multiple regular shows
- special with no conflicts
- special crossing midnight
- special in station timezone
- special around DST boundaries

### Time changes
- one-time move
- permanent future move
- move into an occupied slot
- move earlier
- move later
- change duration
- change while show is actively recording

### Recurrence
- temporary override is not recreated by gap-filling
- future recurring shows resume correctly
- permanent move updates intended future occurrences only
- historical occurrences remain unchanged

### Recording
- moved show starts at new time
- cancelled/suppressed show does not record
- special records when enabled
- special does not record when disabled
- active recording reacts correctly to live schedule change

### Failure / safety
- conflict prevents unintended write
- partial multi-slot operation rolls back
- failed AI provider leaves manual scheduler operational
- Undo restores prior state
- Undo does not corrupt recurring groups
- repeated Undo attempt is safe

---

## 21. Development Approach for Codex

Work incrementally.

### Standalone checkpoint — August 24, 2026

- Repository inspection and architecture review are complete.
- The scaffold, deterministic scheduling core, and portable override/ChangeSet/
  Undo foundations are complete and tested in sibling `ai-scheduler`.
- The current automated suite contains 35 passing scheduling and compatibility
  tests, including parity with StationDock's category taxonomy when both sibling
  repositories are present.
- Phase 3A is validating the data-backed 24/7 operator calendar, readiness
  hierarchy, right-side assistant, themes, and responsive behavior.
- The current operator prototype is deliberately no-write.
- No StationDock application code, recorder code, or production schema has been
  changed by the standalone project.

The active standalone phase details live in
`../ai-scheduler/docs/PHASE-PLAN.md` when both sibling repositories are present.
The following sequence remains the canonical safety order even where the
standalone plan inserts an explicit experience-design gate before reusable views.

### Phase 1 — Inspect
Read the repo and document:
- current scheduling flow
- recurrence logic
- conflict validation
- recording polling/queue behavior
- current data model
- where temporary exceptions best fit
- existing transaction boundaries
- existing alert/settings patterns

**Do not modify code during this phase.**

### Phase 2 — Architecture
Propose the smallest set of changes needed for:
- temporary exceptions/overrides
- reversible change sets
- recorder current-schedule validation
- constrained AI action layer

Avoid broad refactors unless clearly justified.

### Phase 3 — Non-AI foundations first
Implement and test:
- schedule exceptions/overrides
- recorder re-check behavior
- atomic schedule changes
- Undo/change history

These improvements should work for manual scheduling too where practical.

### Phase 4 — AI interpretation layer
Add natural-language interpretation that produces structured scheduling proposals.

The AI should use the non-AI scheduling operations created above.

### Phase 5 — First vertical slice
Make the Malcolm X multi-day special scenario work end-to-end:
- user request
- interpretation
- schedule inspection
- affected-show preview
- recording question
- confirmation
- apply
- recorder behavior
- recurring schedule recovery
- Undo

### Phase 6 — Time changes
Add:
- one-time show move
- recurring future time change
- conflict preview
- Undo

Only expand after these flows are reliable.

---

## 22. Success Criteria

The feature is successful when a non-technical station staff member can type something like:

> “We have Malcolm X special programming next week, Monday through Thursday from noon to 6.”

and StationDock can safely guide them through the operation with dramatically less effort than manual schedule editing.

The user should not need to understand:
- recurrence IDs
- database rows
- override tables
- provider schemas
- recording internals
- transaction boundaries

They should understand:
- what they asked for
- what existing shows will be affected
- whether the special will be recorded
- whether the change is temporary or permanent
- that regular programming will return
- that they can undo the change

---

## 23. Non-Negotiable Product Rules

1. **Ease of use first.**
2. **Manual scheduling always remains available.**
3. **Deterministic code before AI whenever possible.**
4. **AI interprets; StationDock validates and executes.**
5. **Never silently preempt existing programming.**
6. **Temporary changes must not damage recurring schedules.**
7. **Recording consequences must be considered.**
8. **The current database schedule is the recorder's source of truth.**
9. **Consequential AI actions must be previewed before execution.**
10. **Undo is required.**
11. **AI/provider failure must never interrupt normal station operation.**
12. **Do not add complexity merely because AI makes it possible.**

---

## 24. First Instruction to Codex

Use this as the initial prompt after placing this file in the cloned repository:

> Read `AI-SCHEDULING-SPEC.md` and inspect the entire StationDock repository, with special attention to the scheduler, recurring-series logic, recording service, Prisma schema, station settings, alerts, and existing server actions. Do not change code yet. Compare the current architecture against this specification. Identify what already supports the design, what must change, any risks or edge cases you see, and propose the smallest staged implementation plan that preserves the existing manual workflow. Prefer existing StationDock abstractions over new parallel systems.

---

**Status:** Canonical product/safety blueprint; standalone foundations complete
through Phase 2 and Phase 3A design validation is active.

**Next step:** Complete the Phase 3A experience gate, then build the portable
schedule views before beginning provider implementation.

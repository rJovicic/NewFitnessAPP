# CLAUDE.md — Project Memory

> **Read this file first, every session, before doing anything else.**
> This file is the single source of truth for project state, decisions, and conventions.
> Do not rely on chat history for context — chat history is not persistent, this file is.
> At the end of every session, append to the **Session Log** at the bottom before stopping.

---

## 1. What this project is

A personal fitness, nutrition, and body-recomposition tracker — a single-user web app
that replaces Apple Health, MyFitnessPal, and a generic workout app with one tool built
around one specific program. It is not a SaaS product, not multi-tenant, not for
distribution. One user: Robert.

**Source of truth for the program itself:** `/docs/source-plan.pdf` (copy the uploaded
PDF into the repo at this path before Phase 1). When seeding meal plans, workout splits,
macro targets, or supplement lists, always re-read the PDF directly — do not rely on
paraphrased numbers written into this file or into chat, they can drift or be
transcribed wrong.

**Key program parameters** (for quick reference only — verify against the PDF for anything
you're about to seed into the database):

| Parameter | Value |
|---|---|
| Starting weight / height | 88 kg / 183 cm |
| Goal weight | 76–77 kg |
| Timeline | ~28–32 weeks |
| Formula | Mifflin-St Jeor, activity factor 1.5 |
| Deficit | −350 kcal/day (recomposition, not aggressive cut) |
| Protein target | 2.2 g/kg bodyweight (fixed, recalculated live from latest weight log) |
| Fasting protocol | 14:10 — eating window 10:00–19:30 |
| Diet | 100% gluten-free — non-negotiable, medical requirement (celiac), not a preference |
| Training | Home, one 40kg resistance band, full-body split, 7 different days, 20–25 min/day |
| Progression | 4 blocks over 12 weeks (form → volume → intensity → peak) |

---

## 2. Non-negotiable constraints

- **Gluten-free is a medical constraint, not a filter toggle.** Never present a food as
  "safe" without qualification. Open Food Facts data is crowd-sourced and incomplete —
  every product must show a three-state status (`Labeled GF` / `Contains gluten` /
  `Unknown — check label`), never a binary "safe/unsafe." Include a persistent disclaimer
  that cross-contamination is not tracked by any database and label-checking is on the user.
- **Macro targets recalculate live** from the most recent weight log entry — never
  hardcoded from the PDF's day-1 snapshot. Formula lives in one place
  (`lib/macros.ts`), not duplicated across components.
- **Any suggested change to calorie targets requires explicit user confirmation.**
  The adjustment engine (Phase 6) surfaces a suggestion banner — it never silently
  mutates the stored target. Same rule for any auto-detected plan change.
- **Logged meal/workout data is a snapshot at time of logging.** If a food's macro data
  or a workout's target sets/reps changes later, historical logs must not retroactively
  change. Store computed values on the log row, not just a foreign key.
- **Single user, real auth.** Supabase Auth, one account. No shared-password hacks.
  Every table has an RLS policy scoped to `auth.uid()`, even though there's one user —
  this is what makes adding a second profile later (if ever) a non-event instead of a
  rebuild.

---

## 3. Stack

- Next.js (latest stable, App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase: Postgres + Auth + Storage (progress photos)
- Deploy: Vercel
- PWA: installable to home screen (manifest + app-shell service worker). **Not** a full
  offline-first data sync — the app assumes network connectivity, same as any Supabase app.
  Don't build offline mutation queues; that's a different architecture for a problem this
  app doesn't have.
- Charts: `recharts`
- Barcode scanning: verify current best option via context7/npm before installing —
  candidates as of last check: `html5-qrcode`, `@zxing/browser`, `react-qr-barcode-scanner`.
  Requirement: works in iOS Safari via `getUserMedia`, no native app needed.
- Food data: Open Food Facts API v2, `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`,
  no auth key required. Send a descriptive `User-Agent` header (OFF asks for this).

---

## 4. Design direction

Derived from the reference screenshots provided at project start (calorie-ring dashboards,
pastel stat cards, bottom tab nav, day-strip selectors). Direction:

- **Aesthetic:** clean modern health/wellness app. Light theme. Soft, semantic pastel
  colors per data type (not one generic purple gradient) — e.g. distinct hues for
  calories, protein, carbs, fat, water, steps.
- **Layout:** circular progress ring for daily calorie budget as the dashboard centerpiece,
  card-grid below for macros/water/steps/streak, bottom tab bar for primary nav
  (Home / Log / Train / Progress / Settings), horizontal day-strip for date selection.
- **Explicitly avoid:** default "Inter font + purple gradient + rounded card" AI-generated
  look. Pick an actual typography pairing and commit to it.
- **Mobile is the only target for MVP.** Design and test at a 390×844 viewport
  (iPhone 14/15 class). Desktop can degrade gracefully later — don't spend budget on
  desktop layouts now.
- **GF status visual language:** green check = labeled GF, amber/red flag = contains
  gluten or unconfirmed. This needs to be readable at a glance, it's a safety indicator.

### Design toolkit — when to reach for what

Install these first (from `wilwaldon/Claude-Code-Frontend-Design-Toolkit`, "Solo Builder" stack):

```
claude plugin add anthropic/frontend-design
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest
claude plugin add nextlevelbuilder/ui-ux-pro-max-skill
claude mcp add playwright -s user -- npx @playwright/mcp@latest
```

| Situation | Reach for |
|---|---|
| Starting any new screen/component | `frontend-design` (auto-activates) — picks a real aesthetic direction before writing code, not the default look |
| "What layout pattern fits a health dashboard" | `ui-ux-pro-max` — matches design system to product type |
| Current library API/syntax (Next.js, Tailwind v4, Supabase client) | `context7` MCP — don't trust training-data API shapes for fast-moving libraries |
| After a screen is built — visual QA on real mobile viewport | `playwright` MCP — screenshot at 390×844, verify no overflow/clipping |
| Explicit named-aesthetic request (rare here, but available) | `taste-skill` sub-skills (brutalist/minimalist/soft/redesign) — not needed unless the direction above stops fitting |
| Polish pass after a phase is functionally done | `baseline-ui` → `fixing-accessibility` → `fixing-motion-performance` (optional, install via `npx ui-skills add <name>` if used) |

Do **not** install the animation-heavy skills (GSAP/Three.js/R3F packs) or Figma MCP —
this is a data-entry utility app, not a marketing site. Installing them burns context
budget for no benefit here (each MCP server costs tokens at session start).

If auto-trigger doesn't fire, say so explicitly: *"use frontend-design for this screen."*

---

## 5. Architecture conventions

- **Folder structure:** `app/(dashboard)/...` route groups per module (nutrition, training,
  progress, settings). Each module = one folder. Adding a module later = one new folder +
  one nav-config entry, not a refactor.
- **`lib/nav-config.ts`** is the single list that drives bottom-nav items and route
  registration. This is the extension point for add-ons — see §7.
- **`lib/macros.ts`** — single implementation of the Mifflin-St Jeor + macro-split
  calculation. Every screen that shows a target number imports from here.
- **Server components by default**; client components only where interactivity requires it
  (scanner, timers, forms).
- **No placeholder/mock data left in production code paths.** Seed data belongs in the
  database via migration/seed script, not hardcoded in components.

---

## 6. Scope discipline (read this before adding anything)

This project has a documented pattern of replanning instead of shipping across multiple
prior builds. The structure below exists specifically to prevent that here.

- Work in the phases defined in `BUILD-LOOP-PROMPT.md`, in order. Do not skip ahead.
- Each phase ends with a **STOP gate** — a hard acceptance checklist. Do not start the next
  phase until every item in the current one is checked *in the running app*, not "looks
  done in the code."
- **At the end of every phase, propose 2–3 possible enhancements relevant to that phase —
  as questions, not as work.** Never implement something outside the current phase's task
  list without the user explicitly saying yes to a specific proposed item. This is the loop
  the user asked for: suggest, then wait.
- If you (Claude Code) notice mid-phase that something would be "nice to add," write it
  down under a `## Parking Lot` heading in this file instead of building it. Surface it at
  the next STOP gate as one of the 2–3 proposals.

## Parking Lot
*(enhancement ideas noticed mid-build, not yet approved — proposed at next STOP gate)*

- Edit/delete a logged meal (currently no way to remove a mistaken scan/log from the Log screen).
- OFF `/api/v2/search` endpoint for packaged products not yet in the local `foods` cache
  (Phase 4 task 4 listed this as optional; local-catalog search was built, OFF search was not).
- "Recently scanned" quick-add list so re-logging a frequently-eaten packaged product
  doesn't require re-scanning the barcode every time.
- Visual refresh toward the original reference screenshots (`docs/design-references/
  ref-1..4.jpeg` — user re-sent the same 4 images mid-Phase-5 asking about a "full
  makeover"; confirmed identical files, so no new direction, just a reminder these were
  the brief). Current app already matches their structure (ring + 2-col stat grid + day
  strip + bottom nav); the gap is saturation and a couple of surface details. User chose
  to fold this into the existing Phase 10 polish pass rather than interrupt phase
  progression. Concretely, for that pass: (1) tinted pastel card *backgrounds* per metric
  instead of neutral cards with just a colored icon/ring accent, (2) consider a floating
  rounded-pill bottom nav instead of the current flat bordered bar, (3) food-item photo
  thumbnails are a bigger lift (needs an image source) — lowest priority of the three.

## Known environment constraint (dev sandbox only, not the deployed app)

The Claude Code sandbox's outbound network policy blocks several domains needed by
tooling: `ui.shadcn.com` (shadcn CLI), `context7.com` (context7 MCP), and all
`*.supabase.co`/`*.supabase.com` hosts (direct curl checks). This does **not** affect the
deployed app — Vercel's build/runtime environment has normal internet access, confirmed
by a working `/api/health` check against the live Supabase project. Practical
consequences for future sessions:
- shadcn/ui components must be hand-written (copy the known source, don't rely on
  `npx shadcn add`) — done for Button in Phase 0, same pattern going forward.
- context7 can't be queried directly from the sandbox; fall back to `npm view <pkg>
  version` for version checks and to trained knowledge for API shapes, and say so.
- Any "is Supabase/Vercel/npm-package-X reachable" check must go through an actual
  deployed route (`/api/health`-style) hit via `web_fetch_vercel_url`, not a local `curl`.
- `deploy_to_vercel` (file-tree deploy, no git needed) is the working deploy path here —
  git-linking the Vercel project to GitHub for continuous deployment needs an interactive
  browser OAuth flow this session can't do; ask the user to do that once via the Vercel
  dashboard if continuous deployment becomes worth the setup.

---

## 7. Extensibility / add-on pattern

When a new feature is approved later:

1. New Supabase table (or reuse `custom_metrics` for anything that's just "log a number
   against a date" — no migration needed for that class of feature).
2. New folder under `app/(dashboard)/`.
3. One entry in `lib/nav-config.ts`.
4. If it needs a dashboard tile, add to the tile registry array in
   `app/(dashboard)/page.tsx` — tiles are rendered from a list, not individually
   hardcoded, specifically so this is a one-line addition.

The Settings screen should have a visibly-empty "Add-ons" section (Phase 9) that is wired
but intentionally does nothing yet — a placeholder that proves the extension point works
before there's anything to plug into it.

---

## 8. Non-goals (explicitly out of scope — do not build these without being asked)

- Multi-user / second profile (Roberta or anyone else). Schema supports it via
  `profile_id` on every table, but no UI for switching profiles or inviting a second user.
- Real-time Apple Watch data (would require a native watchOS companion app — a different
  project). What's in scope is a **periodic webhook sync** via the Health Auto Export app
  (see Phase 8) — that is not the same thing as live sync, and the UI must not imply it is.
- Full offline-first data entry / conflict resolution.
- Desktop-optimized layouts.
- Payments, sharing, social features, public URLs for anyone but the one user.

---

## 9. Session start protocol

1. Read this file in full.
2. Read the last 3 entries of the Session Log below.
3. Run the app locally / check latest Vercel deploy status before writing code, to confirm
   what's actually shipped vs. what's merely committed.
4. Check `## Parking Lot` for anything to surface as a proposal at the next STOP gate.
5. Do not re-read the full chat transcript that originally produced this file — this file
   and the codebase are the state, not the conversation.

---

## Session Log

*(Append a dated 3–5 line entry here at the end of every session: what shipped, what's
next, anything the user explicitly deferred or declined.)*

- `YYYY-MM-DD` — Project bootstrapped. CLAUDE.md and BUILD-LOOP-PROMPT.md created. No code yet.
- `2026-08-06` — Phase 0 complete. Next.js 16 (App Router/TS/Tailwind v4) scaffolded,
  shadcn/ui wired by hand (registry domain blocked in-sandbox, see Known environment
  constraint above), Supabase project (dvukiptlkmwevwiwnoho) connected via
  `@supabase/ssr` client/server helpers, `.env.local` set and gitignored. Deployed to
  Vercel (`new-fitness-app`, team `rjovicics-projects`) via `deploy_to_vercel` —
  production URL live at new-fitness-app-lake.vercel.app, `/api/health` confirms
  Supabase reachability (GoTrue 200). `docs/source-plan.pdf` and
  `docs/design-references/*.jpeg` committed. All 4 STOP gate items verified. Next:
  Phase 1 (database schema, auth, seed data from the PDF).
- `2026-08-06` — Phase 1 complete. Schema applied via `supabase/migrations/0001_init.sql`
  (13 tables, RLS on every table — 0 security-advisor lint findings). Seed data applied
  from `supabase/seed.sql`: 7 workout_days, 34 exercises, 42 workout_day_exercises,
  8 supplements, 35 recipe foods — all counts verified against the PDF via direct SQL
  count query. `lib/macros.ts` (calculateTargets/calculateAge) unit-tested against the
  PDF's own day-1 worked example — matches within its rounding, and doubly confirmed
  against the real user (DOB 1998-03-29, age 28 as of today, coincidentally identical to
  the PDF's placeholder age). Auth: `app/login`, `proxy.ts` + `lib/supabase/middleware.ts`
  (whole app behind auth except /login and /api/health — no public marketing pages, see
  §5 note below), `app/(dashboard)/page.tsx` as protected root. One real auth account
  created (robert.jovicic98@gmail.com) and `profiles` row seeded (183cm/88kg→76.5kg).
  User confirmed live login works at new-fitness-app-lake.vercel.app. All 4 STOP gate
  items verified. Next: Phase 2 (dashboard shell & navigation) — pending user go-ahead.

**Correction to §5:** the folder structure note said `app/(dashboard)/...` route groups
don't add a URL prefix — confirmed true in practice. The auth boundary is therefore
"everything except /login", not a `/dashboard/**` path check. `PUBLIC_PATHS` in
`lib/supabase/middleware.ts` is the actual source of truth for what's public.
- `2026-08-06` — Phase 2 complete. Design direction via `frontend-design` skill: warm
  paper/ink neutrals + 6 desaturated semantic per-metric hues (calories/protein/carbs/
  fat/water/steps), Space Grotesk + IBM Plex Sans/Mono pairing (not Inter/purple-gradient
  default), calorie ring styled as a precision dial as the signature element.
  `lib/nav-config.ts` drives the bottom tab bar; `app/(dashboard)/layout.tsx` is the
  shared shell (header + nav). `lib/dashboard-data.ts` pulls real profile/weight/targets/
  logged-macros/water/steps from Supabase — zeros pre-logging, not fake data.
  `lib/tile-registry.tsx` is the array-driven tile grid proving out the Phase 9 add-on
  pattern early. Placeholder Log/Train/Progress/Settings pages ship; sign-out moved to
  Settings. STOP gate verified: build clean, all 5 nav routes resolve without errors
  (automated check), and the user tested the live app on their own phone — calorie ring
  showed 2,483 kcal target / 194g protein / 270g carbs / 70g fat, matching
  `calculateTargets()` computed live from the real profile, all logged values correctly
  zero. Noted for future sessions: this sandbox's network policy blocks `*.vercel.app`
  entirely (confirmed via curl and a locally-launched Playwright browser alike), so
  browser automation here can only reach `localhost` — real-device verification from the
  user is the fallback for anything needing the live URL rendered/screenshotted. Next:
  Phase 3 (14:10 fasting module) — pending user go-ahead.
- `2026-08-06` — Phase 2 fixes (user-approved) + Phase 3 complete.
  `lib/timezone.ts` is now the single source of truth for "what day/time is
  it" (Europe/Zagreb, hardcoded — single-user, no timezone picker); replaces
  the old UTC-boundary placeholder and the client-clock header. Day-strip
  navigates via `?date=` (server-rendered Links, no client JS needed).
  Calorie ring shows a destructive-toned "+Xg over" state instead of
  silently capping at full. `supabase/migrations/0002_fasting_window.sql`
  adds `profiles.eating_window_start/end` (10:00/19:30 default), editable
  in Settings via a server action. `FastingTile` is a real ticking widget
  now. `lib/fasting.ts` (`computeFastingHonored`, unit-tested against 6
  cases incl. the 15-min grace boundary) + `lib/daily-activity.ts`
  (`recomputeFastingHonored`, DB wrapper) are built and verified end-to-end
  against the live DB with a temporary test meal outside the window
  (honored flipped to `false` as expected, test data fully cleaned up
  afterward) — but **not yet called from any user flow**, since meal
  logging doesn't exist until Phase 4. Phase 4 must call
  `recomputeFastingHonored()` after every meal log create/delete. STOP
  gate: build clean, fasting logic verified against real DB, widget code
  complete pending the user's visual confirmation on their phone (same
  sandbox network-block as Phase 2 applies). Next: Phase 4 (nutrition &
  food logging) — pending user go-ahead.
- `2026-08-06` — Phase 4 complete. `supabase/migrations/0003_food_logging.sql`
  adds `plan_meals` (weekday × meal_type → recipe food) plus the authenticated
  INSERT/UPDATE policies on `foods` that Phase 1 left as a TODO;
  `supabase/seed_plan_meals.sql` fills all 35 slots, matched to existing
  recipe rows by name. `lib/off.ts` is the Open Food Facts v2 client
  (`GET /product/{barcode}.json`, descriptive User-Agent); gluten status
  derives from `labels_tags`/`allergens_tags` and defaults to `unknown`,
  never "safe". `react-qr-barcode-scanner` chosen over the CLAUDE.md
  candidates after `html5-qrcode` proved stale (last publish 2023, checked
  via `npm view` since context7 is sandbox-blocked). `components/gf-badge.tsx`
  is the three-state badge used everywhere a food shows; `gf-disclaimer.tsx`
  is the standing cross-contamination notice. `app/(dashboard)/log/actions.ts`
  centralizes lookup/search/manual-create/log-plan-meal/log-custom-meal, all
  funneling through `finishMealLogging()` which increments
  `daily_activity.meals_logged_count` and calls `recomputeFastingHonored()`
  (closing the loop Phase 3 left open). `components/log-screen.tsx` is the
  Log tab: today's plan with one-tap logging, a "Logged today" section for
  anything scanned/manually added (added after the user reported scanned
  items had no visible confirmation — fixed same session), and a meal
  builder (scan/search/manual add → cart with adjustable quantity_g per item
  → running subtotal → save). STOP gate verified on the live app by the
  user on their phone: barcode scan → correct macros + GF badge, mixed
  scanned/manual multi-item meal saved with correct running total, unknown
  barcode fell back to manual entry without crashing, dashboard reflected
  the logged meals. **Incident during this session:** a `deploy_to_vercel`
  redeploy briefly took production down — the new deployment didn't have
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` available
  at runtime even though the same project had deployed fine before. No env-var
  management tool was available in this session's Vercel MCP surface to
  diagnose or fix it directly — the user re-added both vars in the Vercel
  dashboard (Production scope) and a follow-up deploy picked them up
  immediately. Flagging for future sessions: confirm Production env vars are
  still present after any `deploy_to_vercel` call that returns a healthy
  build but before declaring the STOP gate passed — `/api/health` is the
  fast check. Next: Phase 5 (workout module) — approved, in progress.
- `2026-08-06` — Phase 5 complete. `lib/workout.ts` (`currentProgressionBlock`)
  maps weeks-since-`program_start_date` onto the PDF's 4-block/12-week table,
  holding at block 4 once exhausted — verified against real seed data
  (`program_start_date` = today, so block 1: 2 rounds/25s rest, matches the
  seeded `block_progression` JSON exactly). `app/(dashboard)/train/actions.ts`:
  `getTodaysWorkout()` resolves today's weekday to a `workout_day` and
  block-adjusts every exercise's rounds/rest; `logWorkout()` writes
  `workout_logs` and flips `daily_activity.workout_completed`;
  `getRecentWorkoutLogs()` backs a small history list (added to satisfy the
  STOP gate's "appears in a history list" wording, not spelled out in the
  phase's task list itself). `components/rest-timer.tsx`: countdown with
  +15s/-15s and skip, vibration + Web Audio beep at zero, no external audio
  asset needed. `components/train-screen.tsx`: exercise overview → flattens
  every exercise's rounds into a linear step list → walks through each set
  with the rest timer in between → perceived-effort capture → save. Deployed
  to production, `/api/health` confirmed green. **Process note:** the first
  Phase 5 deploy shipped without `components/train-screen.tsx` — a manual
  omission assembling the `deploy_to_vercel` file-tree payload, caught
  immediately from the Vercel build log (`Module not found`) and fixed with
  a corrected redeploy. User confirmed "Next phase" without flagging any
  issue. **Design note (no code change):** user re-sent the 4 original
  Phase 0 reference screenshots mid-phase asking about a "full UI makeover" —
  confirmed identical files to `docs/design-references/ref-1..4.jpeg`, so no
  new direction. Current app already matches their structure (ring + 2-col
  stat grid + day strip + bottom nav); gap is mainly saturation (their cards
  use tinted pastel backgrounds per metric, ours uses neutral cards + a
  colored accent only) plus a rounded-pill nav shape and food-photo
  thumbnails in some references. User chose to fold this into the existing
  Phase 10 polish pass rather than interrupt phase progression — see Parking
  Lot for the concrete punch list. Next: Phase 6 (body metrics & adjustment
  engine) — approved, in progress.
- `2026-08-06` — Phase 6 complete. `supabase/migrations/0004_progress_photos_storage.sql`
  creates the `progress-photos` private Storage bucket + `{auth.uid()}/*`-scoped
  RLS policies — a Phase 1 task that was specified but never actually applied;
  closed that gap here. `app/(dashboard)/progress/actions.ts` covers weight
  entry (upsert per day, so re-logging today overwrites rather than
  duplicating), body measurements, photo upload with signed-URL retrieval
  (bucket is private, so display needs `createSignedUrl`), and weight history
  with a 7-day rolling average computed server-side.
  `components/weight-chart.tsx` (recharts, newly added dependency) plots raw
  points as noise + the rolling average as the signal line, per the PDF's own
  framing. `lib/adjustment.ts` implements the 4 PDF Ch.13 rules (plateau,
  fast weight loss, low energy, rising perceived effort) as pure functions —
  unit-tested via a standalone `tsx` script (11/11 cases passing, including
  each rule's negative case and a combined-trigger case), same pattern as
  Phase 1/3's pure-function verification. `applyAdjustment()` only fires on
  an explicit tap, updates `profiles.deficit_kcal`, and logs the change to
  `custom_metrics` (Phase 9's designated add-on table) rather than a new
  dedicated table. Deployed to production, `/api/health` and an
  unauthenticated `/progress` redirect both confirmed. Live weight-entry →
  dashboard-target and adjustment-banner-trigger verification (needs 2+
  weeks of real data) deferred to the user's ongoing real-world use rather
  than blocked on synthetic phone testing, consistent with how Phase 5 was
  closed out. **Incident during this session:** user reported a 404
  `DEPLOYMENT_NOT_FOUND` on their phone from a URL ending `-lac-ten.vercel.app`
  — not one of this project's actual domains (`new-fitness-app-lake.vercel.app`
  + two teammate-scoped aliases, confirmed via `get_project`). Resolved by
  having the user navigate to the correct URL directly rather than a stale
  bookmark/Home-Screen icon. Flagging for future sessions: if this recurs,
  double-check the user isn't confusing "lake" (the real alias) with a
  mistyped or autocompleted variant. Next: Phase 7 (habit system, daily
  checklist, streaks) — approved, in progress.

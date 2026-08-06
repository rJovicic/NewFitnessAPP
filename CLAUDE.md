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

-

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

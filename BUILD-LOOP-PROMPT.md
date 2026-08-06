# Build Loop-Prompt — Personal Fitness/Nutrition Tracker

Paste this whole file into Claude Code as the first message in the project. `CLAUDE.md`
must exist in the repo root before you start (create it from the companion file if it
isn't there yet) — read it before reading this.

## How this works

You are building a full-stack, single-user fitness and nutrition tracker in **PHASES**.
Each phase has a task list and a **STOP gate** — a checklist you must verify *in the
running app*, not by reading your own code. Do not proceed to the next phase until every
item in the current STOP gate passes. Do not skip ahead. Do not silently expand scope.

**At the end of every phase:** propose 2–3 possible enhancements relevant to what you just
built, as questions ("Want me to also add X?"), and stop. Wait for an explicit answer.
Never build something not on the current phase's task list without that explicit yes. If
you notice something worth doing later mid-phase, write it into `CLAUDE.md` under
`## Parking Lot` instead of building it.

**Source data:** copy the attached PDF into the repo at `/docs/source-plan.pdf` before
Phase 1. When seeding meal plans, workout data, or supplement lists, read that file
directly for exact numbers — don't work from memory of a summary.

---

## Phase 0 — Bootstrap

**Tasks:**
1. Scaffold Next.js (latest stable, App Router, TypeScript, Tailwind) project.
2. Install shadcn/ui.
3. Run the design toolkit install commands from `CLAUDE.md` §4 (`frontend-design`,
   `context7`, `ui-ux-pro-max`, `playwright`).
4. Create Supabase project (or connect existing). Store keys in `.env.local`, add
   `.env.local` to `.gitignore`.
5. Set up Vercel project linked to the repo, confirm a blank deploy succeeds before
   writing any feature code.
6. Copy `CLAUDE.md` into the repo root if not already present.
7. Copy the source plan PDF to `/docs/source-plan.pdf`.

**STOP gate:**
- [ ] `npm run dev` runs with zero errors
- [ ] Blank page deploys successfully to a live Vercel URL
- [ ] Supabase project is reachable from the app (test with a trivial query)
- [ ] `CLAUDE.md` and `/docs/source-plan.pdf` exist in the repo

---

## Phase 1 — Database, Auth, Seed Data

**Tasks:**

1. Run this schema as a Supabase migration:

```sql
-- profiles (one row for this user; structured for future multi-profile, not used yet)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  date_of_birth date not null,
  height_cm numeric not null,
  starting_weight_kg numeric not null,
  goal_weight_kg numeric not null,
  activity_factor numeric not null default 1.5,
  protein_g_per_kg numeric not null default 2.2,
  deficit_kcal numeric not null default 350,
  program_start_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- weight_logs
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  logged_at date not null,
  weight_kg numeric not null,
  note text,
  created_at timestamptz not null default now(),
  unique(profile_id, logged_at)
);

-- body_measurements
create table body_measurements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  logged_at date not null,
  waist_cm numeric, chest_cm numeric, hips_cm numeric,
  biceps_cm numeric, thigh_cm numeric,
  note text,
  created_at timestamptz not null default now()
);

-- progress_photos (Supabase Storage holds the file, this holds metadata)
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  logged_at date not null,
  storage_path text not null,
  angle text check (angle in ('front','side','back')),
  created_at timestamptz not null default now()
);

-- foods: local catalog, populated from OFF lookups, manual entries, and PDF recipes
create table foods (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('off','manual','recipe')),
  barcode text unique,
  name text not null,
  brand text,
  kcal_100g numeric not null,
  protein_100g numeric not null,
  carbs_100g numeric not null,
  fat_100g numeric not null,
  gluten_status text not null default 'unknown' check (gluten_status in ('gf_labeled','contains_gluten','unknown')),
  off_raw jsonb,
  created_at timestamptz not null default now()
);

-- meal_logs: one occurrence of "a meal" (e.g. today's lunch)
create table meal_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  meal_type text not null check (meal_type in ('obrok_1','snack_1','obrok_2','snack_2','obrok_3','extra')),
  source text not null default 'custom' check (source in ('plan','custom')),
  plan_day_ref text,
  note text,
  created_at timestamptz not null default now()
);

-- meal_items: N items per meal_log — this is what lets multiple scanned products go
-- into a single meal instead of one-item-per-meal
create table meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references meal_logs(id) on delete cascade,
  food_id uuid references foods(id),
  custom_name text,
  quantity_g numeric not null,
  kcal numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  created_at timestamptz not null default now()
);
-- kcal/protein_g/carbs_g/fat_g are computed at insert time (quantity_g/100 * food macro)
-- and stored as a snapshot — historical logs must not drift if a food record is edited later.

-- workout_days (seed, 7 rows)
create table workout_days (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6), -- 0=Monday
  focus_name text not null,
  duration_min int not null
);

-- exercises (seed catalog)
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text not null default 'band',
  instructions text
);

-- workout_day_exercises (seed join, ordered, with block-progression targets as jsonb
-- since sets/rest change across the 4 progression blocks)
create table workout_day_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references workout_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  order_index int not null,
  reps_target text not null,
  block_progression jsonb not null
  -- e.g. {"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}
);

-- workout_logs (completed sessions)
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  workout_day_id uuid not null references workout_days(id),
  logged_at timestamptz not null default now(),
  duration_seconds int,
  rounds_completed int,
  perceived_effort int check (perceived_effort between 1 and 5),
  completed boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

-- workout_set_logs (optional granular logging — build the UI for it but it's fine if
-- usage is sparse; don't block the phase on this being exhaustively used)
create table workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references workout_logs(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  set_number int not null,
  reps_done int,
  rest_seconds_actual int
);

-- supplements (seed) + supplement_logs (daily checklist)
create table supplements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dose text,
  timing_note text,
  recommended boolean not null default true
);
create table supplement_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  supplement_id uuid not null references supplements(id),
  logged_date date not null,
  taken boolean not null default false,
  unique(profile_id, supplement_id, logged_date)
);

-- daily_activity: one row per day, backs the streak system and the daily checklist
create table daily_activity (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  activity_date date not null,
  workout_completed boolean not null default false,
  meals_logged_count int not null default 0,
  water_ml int not null default 0,
  steps int,
  sleep_hours numeric,
  energy_level int check (energy_level between 1 and 10),
  fasting_window_honored boolean,
  unique(profile_id, activity_date)
);

-- health_metrics: ingested from the Apple Health webhook bridge (Phase 8)
create table health_metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  metric_type text not null check (metric_type in
    ('steps','heart_rate','resting_heart_rate','sleep_hours','active_energy_kcal','weight_kg')),
  recorded_at timestamptz not null,
  value numeric not null,
  raw jsonb,
  source text not null default 'health_auto_export',
  created_at timestamptz not null default now(),
  unique(profile_id, metric_type, recorded_at)
);

-- custom_metrics: generic add-on table — log any named metric without a migration
create table custom_metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  metric_name text not null,
  value numeric not null,
  unit text,
  logged_at timestamptz not null default now(),
  note text
);

-- RLS: every profile-scoped table gets the same policy shape. Example for weight_logs,
-- repeat the pattern for: body_measurements, progress_photos, meal_logs, workout_logs,
-- workout_set_logs (via join), supplement_logs, daily_activity, health_metrics, custom_metrics.
alter table weight_logs enable row level security;
create policy "own rows only" on weight_logs
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
-- foods, exercises, workout_days, workout_day_exercises, supplements are shared
-- reference/catalog data, not profile-scoped — enable RLS with a read-only-to-authenticated
-- policy, writes only via service role (seed scripts).
```

2. Apply the RLS pattern above to every profile-scoped table (the migration above shows
   it once for `weight_logs` — replicate, don't skip).
3. Set up Supabase Auth: email + password, single account, no public sign-up flow exposed
   in the UI (create the one account via Supabase dashboard directly). Add Next.js
   middleware that redirects to `/login` for any unauthenticated request to
   `app/(dashboard)/**`.
4. Set up a private Supabase Storage bucket `progress-photos` with a policy restricting
   access to `{auth.uid()}/*` paths.
5. Extract seed data from `/docs/source-plan.pdf` and write it as a seed SQL script or
   TypeScript seed script (your choice) covering:
   - `workout_days` (7 rows), `exercises` (all unique exercises across all 7 days),
     `workout_day_exercises` (full join with the 4-block progression from the PDF's
     progression table)
   - `supplements` (from the supplements chapter)
   - `foods` with `source='recipe'` for every meal/snack in the 7-day plan and the "20
     extra meals + 20 snacks" chapter, with macros as given in the PDF
6. Build `lib/macros.ts`: single function `calculateTargets(profile, latestWeightKg, age)`
   implementing Mifflin-St Jeor exactly as the PDF specifies:
   - `BMR = 10*weight_kg + 6.25*height_cm - 5*age + 5`
   - `TDEE = BMR * activity_factor`
   - `targetKcal = TDEE - deficit_kcal`
   - `proteinG = protein_g_per_kg * weight_kg` → `proteinKcal = proteinG * 4`
   - remaining kcal after protein splits carbs/fat at the same ratio as the PDF's day-1
     numbers (1080 kcal carbs : 630 kcal fat, i.e. ~63.5% / ~36.5% of the remainder) —
     compute this ratio from the PDF numbers rather than hardcoding grams.
   - Age comes from `date_of_birth`, calculated at call time — never hardcode age 28,
     that was the PDF's placeholder, not a real value.

**STOP gate:**
- [ ] Can log in with the one account; unauthenticated requests redirect to `/login`
- [ ] All tables exist with RLS enabled; a query as an authenticated user only returns
      that user's rows (verify by checking the query plan or testing with a second
      throwaway user)
- [ ] Seed row counts match the PDF: 7 workout days, correct exercise count, all 35
      weekly meal/snack slots present as `foods` rows, supplement list present
- [ ] `calculateTargets()` unit-tested against the PDF's own day-1 numbers (88kg, age
      from real DOB — note the test will not match the PDF's 195g/270g/70g exactly if
      real age ≠ 28, and that's correct behavior, not a bug)

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 2 — Dashboard shell & navigation

**Tasks:**
1. Apply `frontend-design` skill per `CLAUDE.md` §4 before writing any component.
2. Build the app shell: bottom tab nav driven by `lib/nav-config.ts` (Home / Log / Train
   / Progress / Settings), top header with greeting + date.
3. Build the dashboard home screen with a tile registry (array-driven, not hardcoded
   JSX per tile — this is what makes Phase 9's add-on slot trivial):
   - Calorie ring (target vs. logged today, from live `calculateTargets()`)
   - Macro bars (protein/carbs/fat)
   - Water tile
   - Streak tile (placeholder value until Phase 7)
   - Fasting window status (placeholder until Phase 3)
4. Confirm mobile viewport (390×844) via Playwright screenshot — no horizontal scroll,
   no clipped content, bottom nav doesn't overlap content on any screen.

**STOP gate:**
- [ ] Dashboard renders live data from Supabase (even if mostly zeros pre-logging)
- [ ] Playwright screenshot at 390×844 shows a clean, non-clipped layout
- [ ] Bottom nav navigates to placeholder pages for all 5 sections without errors

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 3 — Fasting (14:10) module

**Tasks:**
1. Build a fasting status widget: current state (fasting / eating window open), time
   remaining until window opens or closes, based on `program`'s window (10:00–19:30
   default, editable in settings).
2. On window close each day, compute `fasting_window_honored` for `daily_activity` from
   whether all `meal_logs` for that day fall inside the window (with a small grace
   buffer, e.g. 15 min — flag this buffer as your own reasonable default, not a PDF spec).
3. Simple settings control to adjust the window times if the user's schedule shifts.

**STOP gate:**
- [ ] Widget correctly shows fasting/eating state and counts down in real time
- [ ] A test meal logged outside the window correctly flips `fasting_window_honored` to false

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 4 — Nutrition & food logging

**Tasks:**
1. **Plan view:** show today's prescribed meals/snacks from the seeded 7-day plan
   (`foods` where `source='recipe'`, matched to day-of-week), with a one-tap "log as
   eaten" that creates a `meal_log` + `meal_items` from the recipe's stored macros.
2. **Barcode scanner:**
   - Verify current best library via context7/npm (see `CLAUDE.md` §3), then implement
     camera-based scanning behind a "Scan" button on the Log screen.
   - On successful scan, call Open Food Facts:
     `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
     with a descriptive `User-Agent` header. Cache the result into `foods` (upsert on
     `barcode`) so repeat scans don't re-hit the API.
   - Derive `gluten_status` from OFF's `labels_tags`/`allergens_tags`: `gf_labeled` if
     a gluten-free label tag is present, `contains_gluten` if gluten allergen tag is
     present, otherwise `unknown`. Never default to "safe."
   - If OFF returns `status: 0` (not found), fall back to manual entry for that item.
3. **Multi-item meal entry:** the log flow must support adding several scanned or
   manually-entered items to the *same* `meal_log` before saving — this is a hard
   requirement, not one-barcode-per-meal. Show a running subtotal of the meal's macros
   as items are added, with an adjustable quantity (grams) per item.
4. **Manual search fallback:** text search against the local `foods` catalog first
   (covers PDF recipes and previously-scanned items), then optionally OFF's search
   endpoint (`/api/v2/search`) for packaged products not yet scanned.
5. Every meal item display shows the GF status badge (green/amber/red per `CLAUDE.md` §4)
   next to the item, plus the standing disclaimer that this is not a guarantee.
6. On save, update `daily_activity.meals_logged_count` for that day.

**STOP gate:**
- [ ] Scanning a real product barcode on a phone returns correct macro data and a
      correct GF status
- [ ] Logging a meal with 3+ different items (mix of scanned + manual) works in one
      meal_log and shows a correct running total
- [ ] A product not in OFF correctly falls back to manual entry, no crash
- [ ] `daily_activity.meals_logged_count` updates correctly after logging

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 5 — Workout module

**Tasks:**
1. Today's workout view: pulls the correct `workout_day` by weekday, lists exercises in
   order with sets/reps/rest for the user's current progression block (compute current
   block from weeks elapsed since `program_start_date`, per the PDF's 4-block 12-week table).
2. **Rest timer component:** starts automatically when a set is marked done, big
   countdown display, +15s/−15s adjust, skip button. At zero: vibration
   (`navigator.vibrate` where supported) + audio beep, since a background browser tab
   cannot reliably fire a native notification — this is a real web platform limit, not
   a bug to chase.
3. Log a completed workout: `workout_logs` row with duration, rounds completed,
   perceived effort (1–5, feeds Phase 6's adjustment engine), sets optionally logged to
   `workout_set_logs`.
4. On completion, update `daily_activity.workout_completed` for that day.

**STOP gate:**
- [ ] Correct workout shows for today's weekday, with correct block-adjusted sets/rest
- [ ] Rest timer runs, adjusts, and alerts correctly through a full circuit on a real phone
- [ ] Completing a workout updates `daily_activity` and appears in a history list

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 6 — Body metrics & adjustment engine

**Tasks:**
1. Weight log entry (date + kg), body measurements entry, progress photo upload
   (front/side/back) to the `progress-photos` bucket.
2. Weight trend chart: raw daily points + a 7-day rolling average line (per the PDF's
   own guidance — daily fluctuation is noise, the rolling average is signal).
3. Dashboard's calorie/macro targets always compute from the *latest* weight log via
   `calculateTargets()` — verify this actually recalculates on new entries, don't cache
   a stale target.
4. **Adjustment engine** — a banner, not a silent change, following the PDF's Chapter 13
   rules exactly:
   - No weight loss over 2+ weeks (rolling average flat/up) → suggest −150/−200 kcal
   - Losing >0.6 kg/week (rolling average) → suggest +150 kcal
   - `energy_level` logged low for several consecutive days → suggest +100–150 kcal from protein
   - `perceived_effort` on workouts trending up (workload feeling harder) for 2+ weeks →
     suggest a pre-workout carb bump or a deload week
   - Every suggestion requires an explicit tap to apply; applying updates
     `profiles.deficit_kcal` (or a note, your call on exact field) and logs what changed
     and why for later review.

**STOP gate:**
- [ ] Logging a new weight entry immediately changes the dashboard's calorie/macro targets
- [ ] Rolling-average chart renders correctly with at least 2 weeks of seeded/test data
- [ ] Each of the 4 adjustment rules can be manually triggered with test data and produces
      the correct suggestion banner — and applying it requires a tap, never happens automatically

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 7 — Habit system, daily checklist, streaks

**Tasks:**
1. Implement the PDF's Chapter 11 daily checklist directly: workout done, 3+ meals
   logged, water ≥ target, steps toward goal, sleep 7h+ — each auto-derived from existing
   tables where possible (`daily_activity`), manual toggle/entry where not yet
   automated (water quick-add buttons: +250ml/+500ml; sleep manual entry until Phase 8
   wires up the Health bridge).
2. Supplement checklist (from seeded `supplements`), one tap per item per day into
   `supplement_logs`.
3. **Streak calculation:** a SQL view or computed query, not a stored counter that can
   drift. Default streak definition: consecutive days where
   `workout_completed = true AND meals_logged_count >= 3`. Make this configurable later
   (note it in `CLAUDE.md` Parking Lot, don't build a settings UI for it now unless asked).
4. Streak tile on dashboard replaces the Phase 2 placeholder with the real computed value.

**STOP gate:**
- [ ] Daily checklist reflects real logged data, updates live as items are logged elsewhere
- [ ] Streak count is correct against manually verified test data (build a small test
      sequence of days and confirm the number matches by hand)
- [ ] Breaking a streak (skip a day) correctly resets it, doesn't just plateau

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 8 — Apple Health / Watch bridge

**Reality check, not a workaround:** a web app cannot read HealthKit or Apple Watch data
directly — Apple does not expose that to browsers, and true live sync would require a
native watchOS companion app, which is a separate project. What *is* realistic and what
this phase builds: a **webhook receiver** that accepts periodic exports from the
"Health Auto Export" iOS app (or an equivalent), which the user configures on their
phone to POST HealthKit data to our endpoint on a schedule. This is periodic sync, not
live — the UI must not imply real-time.

**Tasks:**
1. Build `app/api/health-webhook/route.ts`: accepts `POST`, validates a bearer token
   (stored as a Vercel env var, generated once, entered into the Health Auto Export app's
   REST automation config), parses the JSON payload for steps / heart rate / resting
   heart rate / sleep hours / active energy / weight, and upserts into `health_metrics`
   (and into `weight_logs` specifically for weight, since that's the canonical table for
   weight elsewhere in the app).
2. Write a short setup doc (`/docs/apple-health-setup.md`) with the exact steps: install
   Health Auto Export, create a REST API automation, point it at
   `https://<your-vercel-domain>/api/health-webhook`, set the bearer token, select which
   metrics to export, set frequency.
3. Dashboard tiles for steps and sleep read from `health_metrics` if present for the day,
   falling back to the Phase 7 manual entry if not yet synced.

**STOP gate:**
- [ ] A manually-sent test POST (curl/Postman) with a valid token correctly writes rows
- [ ] An invalid/missing token is rejected (401), confirm this before relying on it
- [ ] Following the setup doc on a real phone, a real Health Auto Export sync populates
      real data in the app

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 9 — Add-on scaffold

**Tasks:**
1. Add a visibly-empty "Add-ons" section to Settings — wired to render from an array
   (empty for now), proving the extension point works without yet having anything to
   plug in.
2. Confirm the pattern documented in `CLAUDE.md` §7 actually works: as a smoke test,
   add one trivial extra metric (e.g. "morning mood, 1–5") using only `custom_metrics` +
   one new nav-config entry + one new tile-registry entry — no new migration. This proves
   the extensibility claim rather than just asserting it.
3. Remove the smoke-test feature afterward if the user doesn't want it kept, or keep it
   if they do — ask.

**STOP gate:**
- [ ] The smoke-test add-on works end-to-end (log a value, see it on the dashboard)
      using only the documented extension points, no schema migration

**Propose 2–3 enhancements here, then stop and wait.**

---

## Phase 10 — PWA polish, QA, deploy

**Tasks:**
1. `manifest.json` + icon set, installable to home screen on iOS/Android.
2. Minimal app-shell service worker (cache static assets only — not a data sync layer,
   per `CLAUDE.md` §3 non-goals).
3. Full Playwright pass at 390×844 across every screen built in Phases 2–9: no overflow,
   no clipped text, tap targets reasonably sized for thumb use.
4. Accessibility pass (contrast, focus states, form labels) — use `fixing-accessibility`
   skill if installed, otherwise a manual pass against WCAG AA basics.
5. Production deploy: confirm environment variables are set in Vercel, confirm the
   Supabase project used is the production one (not a dev/test project), confirm the
   Health webhook URL in the setup doc matches the live domain.
6. Update `CLAUDE.md` Session Log with what shipped.

**STOP gate — this is the real one:**
- [ ] The user has logged one full real day on the live production URL: one workout with
      the rest timer, at least one barcode-scanned meal with 2+ items, a weight entry,
      the daily checklist, and can see the streak count reflect it. Not "the code
      supports this" — actually done, on the phone, on the live app.

**Propose 2–3 enhancements here, then stop.** After this phase, treat the app as shipped.
Any further work is a new, explicitly-scoped phase — not scope creep on this one.

-- Phase 1: initial schema for Robert's personal fitness/nutrition tracker.
-- Single user, real Supabase Auth, RLS scoped to auth.uid() on every
-- profile-scoped table even though there is exactly one user today —
-- see CLAUDE.md section 2.

-- ============================================================
-- profiles
-- ============================================================
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

alter table profiles enable row level security;
create policy "own profile only" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- ============================================================
-- weight_logs
-- ============================================================
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  logged_at date not null,
  weight_kg numeric not null,
  note text,
  created_at timestamptz not null default now(),
  unique(profile_id, logged_at)
);

alter table weight_logs enable row level security;
create policy "own rows only" on weight_logs
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================
-- body_measurements
-- ============================================================
create table body_measurements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  logged_at date not null,
  waist_cm numeric, chest_cm numeric, hips_cm numeric,
  biceps_cm numeric, thigh_cm numeric,
  note text,
  created_at timestamptz not null default now()
);

alter table body_measurements enable row level security;
create policy "own rows only" on body_measurements
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================
-- progress_photos (Supabase Storage holds the file, this holds metadata)
-- ============================================================
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  logged_at date not null,
  storage_path text not null,
  angle text check (angle in ('front','side','back')),
  created_at timestamptz not null default now()
);

alter table progress_photos enable row level security;
create policy "own rows only" on progress_photos
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================
-- foods: local catalog, populated from OFF lookups, manual entries, and
-- PDF recipes. For source='recipe' rows, kcal_100g/protein_100g/carbs_100g/
-- fat_100g are repurposed to hold the FULL RECIPE'S totals (not a true
-- per-100g value) — the source PDF gives per-serving totals for composite
-- meals, not per-100g breakdowns or total recipe weight. Logging one such
-- item with quantity_g = 100 yields exactly the recipe's stated macros
-- (quantity_g/100 * food macro = 1.0x). This convention applies ONLY to
-- source='recipe' rows; 'off' and 'manual' rows use true per-100g values.
-- ============================================================
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

alter table foods enable row level security;
create policy "read for authenticated" on foods
  for select using (auth.role() = 'authenticated');
-- No insert/update/delete policy yet — Phase 1 seeds via migration only.
-- Phase 4 (barcode scan caching, manual entry) will need an authenticated
-- INSERT policy here; noted in CLAUDE.md Parking Lot, not built now.

-- ============================================================
-- meal_logs: one occurrence of "a meal" (e.g. today's lunch)
-- ============================================================
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

alter table meal_logs enable row level security;
create policy "own rows only" on meal_logs
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================
-- meal_items: N items per meal_log — lets multiple scanned products go
-- into a single meal instead of one-item-per-meal. kcal/protein_g/carbs_g/
-- fat_g are computed at insert time and stored as a snapshot — historical
-- logs must not drift if a food record is edited later.
-- ============================================================
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

alter table meal_items enable row level security;
create policy "own rows only" on meal_items
  for all using (
    exists (
      select 1 from meal_logs ml
      where ml.id = meal_items.meal_log_id and ml.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from meal_logs ml
      where ml.id = meal_items.meal_log_id and ml.profile_id = auth.uid()
    )
  );

-- ============================================================
-- workout_days (seed, 7 rows) — shared reference data
-- ============================================================
create table workout_days (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6), -- 0=Monday
  focus_name text not null,
  duration_min int not null
);

alter table workout_days enable row level security;
create policy "read for authenticated" on workout_days
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- exercises (seed catalog) — shared reference data
-- ============================================================
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text not null default 'band',
  instructions text
);

alter table exercises enable row level security;
create policy "read for authenticated" on exercises
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- workout_day_exercises (seed join, ordered, with block-progression
-- targets as jsonb since rounds/rest change across the 4 progression
-- blocks) — shared reference data
-- ============================================================
create table workout_day_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references workout_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  order_index int not null,
  reps_target text not null,
  block_progression jsonb not null
  -- e.g. {"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}
);

alter table workout_day_exercises enable row level security;
create policy "read for authenticated" on workout_day_exercises
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- workout_logs (completed sessions)
-- ============================================================
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

alter table workout_logs enable row level security;
create policy "own rows only" on workout_logs
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================
-- workout_set_logs (optional granular logging)
-- ============================================================
create table workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references workout_logs(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  set_number int not null,
  reps_done int,
  rest_seconds_actual int
);

alter table workout_set_logs enable row level security;
create policy "own rows only" on workout_set_logs
  for all using (
    exists (
      select 1 from workout_logs wl
      where wl.id = workout_set_logs.workout_log_id and wl.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_logs wl
      where wl.id = workout_set_logs.workout_log_id and wl.profile_id = auth.uid()
    )
  );

-- ============================================================
-- supplements (seed) + supplement_logs (daily checklist)
-- ============================================================
create table supplements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dose text,
  timing_note text,
  recommended boolean not null default true
);

alter table supplements enable row level security;
create policy "read for authenticated" on supplements
  for select using (auth.role() = 'authenticated');

create table supplement_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  supplement_id uuid not null references supplements(id),
  logged_date date not null,
  taken boolean not null default false,
  unique(profile_id, supplement_id, logged_date)
);

alter table supplement_logs enable row level security;
create policy "own rows only" on supplement_logs
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================
-- daily_activity: one row per day, backs the streak system and the
-- daily checklist
-- ============================================================
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

alter table daily_activity enable row level security;
create policy "own rows only" on daily_activity
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================
-- health_metrics: ingested from the Apple Health webhook bridge (Phase 8)
-- ============================================================
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

alter table health_metrics enable row level security;
create policy "own rows only" on health_metrics
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================
-- custom_metrics: generic add-on table — log any named metric without a
-- migration (Phase 9 extensibility proof)
-- ============================================================
create table custom_metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  metric_name text not null,
  value numeric not null,
  unit text,
  logged_at timestamptz not null default now(),
  note text
);

alter table custom_metrics enable row level security;
create policy "own rows only" on custom_metrics
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

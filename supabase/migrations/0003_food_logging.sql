-- Phase 4: nutrition & food logging.

-- ============================================================
-- plan_meals: links the Phase 1 seeded recipe foods to the weekday +
-- meal slot they belong to (the 7-day plan table itself), so the Log
-- screen can show "today's prescribed meals." This didn't exist in
-- Phase 1 because foods had no day/slot association yet.
-- ============================================================
create table plan_meals (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6), -- 0=Monday
  meal_type text not null check (meal_type in ('obrok_1','snack_1','obrok_2','snack_2','obrok_3')),
  food_id uuid not null references foods(id),
  unique(weekday, meal_type)
);

alter table plan_meals enable row level security;
create policy "read for authenticated" on plan_meals
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- foods: allow authenticated writes for scanned/manual items (recipe
-- rows stay seed-only). Noted as a Phase 1 follow-up in migration 0001.
-- ============================================================
create policy "authenticated can insert scanned or manual foods" on foods
  for insert
  with check (auth.role() = 'authenticated' and source in ('off', 'manual'));

create policy "authenticated can update cached off foods" on foods
  for update
  using (auth.role() = 'authenticated' and source = 'off')
  with check (auth.role() = 'authenticated' and source = 'off');

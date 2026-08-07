-- Phase 1 seed data, extracted directly from docs/source-plan.pdf.
-- Re-run source: if numbers ever look off, re-read the PDF, don't trust this
-- file's transcription blindly (per CLAUDE.md section 1).

-- ============================================================
-- workout_days (Poglavlje 6) — duration stored as the lower bound of the
-- PDF's stated "20-25 min" range.
-- ============================================================
insert into workout_days (id, weekday, focus_name, duration_min) values
  ('00000000-0000-0000-0001-000000000001', 0, 'Guranje + Noge', 20),
  ('00000000-0000-0000-0001-000000000002', 1, 'Povlačenje + Gluteji', 20),
  ('00000000-0000-0000-0001-000000000003', 2, 'Noge + Core', 20),
  ('00000000-0000-0000-0001-000000000004', 3, 'Ramena + Ruke', 20),
  ('00000000-0000-0000-0001-000000000005', 4, 'Stražnji lanac + Core', 20),
  ('00000000-0000-0000-0001-000000000006', 5, 'Metabolic Circuit', 20),
  ('00000000-0000-0000-0001-000000000007', 6, 'Mobilnost + Light Circuit', 20);

-- ============================================================
-- exercises (unique catalog across all 7 days)
-- ============================================================
insert into exercises (id, name, muscle_group, equipment) values
  ('00000000-0000-0000-0002-000000000001', 'Sklekovi', 'chest', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000002', 'Band shoulder press', 'shoulders', 'band'),
  ('00000000-0000-0000-0002-000000000003', 'Band čučnjevi', 'legs', 'band'),
  ('00000000-0000-0000-0002-000000000004', 'Diamond push-ups', 'triceps', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000005', 'Reverse lunges', 'legs', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000006', 'Plank', 'core', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000007', 'Band redovi', 'back', 'band'),
  ('00000000-0000-0000-0002-000000000008', 'Band pull-aparts', 'shoulders', 'band'),
  ('00000000-0000-0000-0002-000000000009', 'Glute bridges s trakom', 'glutes', 'band'),
  ('00000000-0000-0000-0002-000000000010', 'Band donkey kicks', 'glutes', 'band'),
  ('00000000-0000-0000-0002-000000000011', 'Band monster walks', 'glutes', 'band'),
  ('00000000-0000-0000-0002-000000000012', 'Superman hold', 'lower_back', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000013', 'Band RDL', 'hamstrings', 'band'),
  ('00000000-0000-0000-0002-000000000014', 'Bugarski split čučnjevi', 'legs', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000015', 'Band leg press', 'legs', 'band'),
  ('00000000-0000-0000-0002-000000000016', 'Podizanje nogu', 'core', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000017', 'Band woodchops', 'core', 'band'),
  ('00000000-0000-0000-0002-000000000018', 'Side plank', 'core', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000019', 'Band overhead press', 'shoulders', 'band'),
  ('00000000-0000-0000-0002-000000000020', 'Band bicep curls', 'biceps', 'band'),
  ('00000000-0000-0000-0002-000000000021', 'Band tricep pushdown', 'triceps', 'band'),
  ('00000000-0000-0000-0002-000000000022', 'Band lateral raises', 'shoulders', 'band'),
  ('00000000-0000-0000-0002-000000000023', 'Pike push-ups', 'shoulders', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000024', 'Plank shoulder taps', 'core', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000025', 'Band deadlifts', 'hamstrings', 'band'),
  ('00000000-0000-0000-0002-000000000026', 'Hip thrust', 'glutes', 'band'),
  ('00000000-0000-0000-0002-000000000027', 'Bird dog', 'core', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000028', 'Dead bug', 'core', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000029', 'Squat jumps', 'legs', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000030', 'Mountain climbers', 'core', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000031', 'Burpees', 'full_body', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000032', 'Tjelesni čučnjevi (spor tempo)', 'legs', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000033', 'Glute bridges', 'glutes', 'bodyweight'),
  ('00000000-0000-0000-0002-000000000034', 'Cat-cow', 'mobility', 'bodyweight');

-- ============================================================
-- workout_day_exercises — block_progression is the same 4-block table
-- (Poglavlje 6 "12-Tjedna Progresija") applied to every row; reps_target
-- is the day-specific value from each day's own exercise table.
-- ============================================================
insert into workout_day_exercises (workout_day_id, exercise_id, order_index, reps_target, block_progression)
values
  -- PON — Guranje + Noge
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 1, '10-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', 2, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003', 3, '15-20', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000004', 4, '8-12', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000005', 5, '10/nozi', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000006', 6, '30-45s', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  -- UTO — Povlačenje + Gluteji
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000007', 1, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000008', 2, '15-20', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000009', 3, '15-20', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000010', 4, '15/nozi', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000011', 5, '10 koraka/strana', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000012', 6, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  -- SRI — Noge + Core
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000013', 1, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000014', 2, '10/nozi', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000015', 3, '15-20', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000016', 4, '15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000017', 5, '12/strana', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000018', 6, '30-45s', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  -- ČET — Ramena + Ruke
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0002-000000000019', 1, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0002-000000000020', 2, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0002-000000000021', 3, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0002-000000000022', 4, '15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0002-000000000023', 5, '8-12', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0002-000000000024', 6, '20 (10/strana)', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  -- PET — Stražnji lanac + Core
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0002-000000000025', 1, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0002-000000000007', 2, '12-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0002-000000000026', 3, '15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0002-000000000027', 4, '10/strana', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0002-000000000028', 5, '10/strana', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0002-000000000006', 6, '30-60s', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  -- SUB — Metabolic Circuit
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0002-000000000029', 1, '10-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0002-000000000001', 2, '10-15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0002-000000000003', 3, '15-20', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0002-000000000030', 4, '30s', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0002-000000000007', 5, '15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0002-000000000031', 6, '8-12', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  -- NED — Mobilnost + Light Circuit
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0002-000000000032', 1, '15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0002-000000000008', 2, '15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0002-000000000033', 3, '15', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0002-000000000034', 4, '10', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0002-000000000027', 5, '10/strana', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}'),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0002-000000000006', 6, '20-30s', '{"1":{"rounds":2,"rest_s":25},"2":{"rounds":3,"rest_s":18},"3":{"rounds":3,"rest_s":12},"4":{"rounds":4,"rest_s":10}}');

-- ============================================================
-- supplements (Poglavlje 12)
-- ============================================================
insert into supplements (name, dose, timing_note, recommended) values
  ('Protein prah (GF)', '1-2 shaka/dan', 'Whey izolat je GF, ili rice/pea protein ako izbjegavaš mliječne proizvode', true),
  ('Kreatin monohidrat', '5g/dan', 'Snaga + mišićna retencija u deficitu', true),
  ('Vitamin D3', '2.000-4.000 IU', 'Većina populacije je deficitarna, posebno zimi', true),
  ('Omega-3 riblje ulje', '2-3g EPA/DHA', 'Upale, oporavak, kardiovaskularno zdravlje', true),
  ('Magnezij glicinat', '300-400mg', 'Navečer — san, oporavak mišića, smanjenje kortizola', true),
  ('Elektroliti (bez kalorija)', '1x dnevno, više uz trening', 'Posebno važno tijekom IF adaptacije i ljeti', true),
  ('Fat burners', null, 'Placebo efekt + nepotreban rizik. Nema dobre evidencije.', false),
  ('Detox čajevi', null, 'Jetra i bubrezi već rade detox. Nepotrebno i bez evidencije.', false);

-- ============================================================
-- foods (source='recipe') — all 35 weekly meal/snack slots (Poglavlje 3).
-- kcal_100g/protein_100g/carbs_100g/fat_100g hold the recipe's FULL totals
-- per the convention documented in migration 0001 (log with quantity_g=100
-- to get the full recipe). gluten_status is gf_labeled for every item — the
-- whole plan is stated 100% gluten-free.
-- ============================================================
insert into foods (source, name, kcal_100g, protein_100g, carbs_100g, fat_100g, gluten_status) values
  -- Ponedjeljak
  ('recipe', 'GF Zobene pahuljice s bananama', 590, 45, 65, 15, 'gf_labeled'),
  ('recipe', 'Grčki jogurt + borovnice + chia', 280, 20, 18, 12, 'gf_labeled'),
  ('recipe', 'Piletina s rižom i sotiranim povrćem', 720, 52, 80, 18, 'gf_labeled'),
  ('recipe', 'Jabuka + kikiriki maslac', 240, 7, 28, 13, 'gf_labeled'),
  ('recipe', 'Losos s batatom i brokolijem', 610, 48, 50, 22, 'gf_labeled'),
  -- Utorak
  ('recipe', 'Omlet s avokadom i feta sirom', 580, 38, 8, 45, 'gf_labeled'),
  ('recipe', 'Bademi + naranča', 280, 10, 22, 18, 'gf_labeled'),
  ('recipe', 'Quinoa bowl s tunom i povrćem', 710, 58, 72, 20, 'gf_labeled'),
  ('recipe', 'Skuta s kruškama', 290, 28, 30, 8, 'gf_labeled'),
  ('recipe', 'Goveđe mesne kuglice s rižom', 680, 55, 60, 22, 'gf_labeled'),
  -- Srijeda
  ('recipe', 'Smoothie zdjela', 590, 42, 62, 18, 'gf_labeled'),
  ('recipe', '2 tvrdo kuhana jaja + jabuka', 220, 14, 20, 10, 'gf_labeled'),
  ('recipe', 'Pileći burito bowl (GF)', 780, 58, 78, 22, 'gf_labeled'),
  ('recipe', 'Hummus s povrćem', 250, 9, 22, 14, 'gf_labeled'),
  ('recipe', 'Bakalar u pećnici s krumpirom', 620, 54, 52, 20, 'gf_labeled'),
  -- Četvrtak
  ('recipe', 'GF palačinke s jagodama', 550, 28, 72, 14, 'gf_labeled'),
  ('recipe', 'Protein shake', 280, 35, 22, 5, 'gf_labeled'),
  ('recipe', 'Varivo od leće s piletinom', 680, 52, 78, 12, 'gf_labeled'),
  ('recipe', 'Orasi + GF tamna čokolada (Četvrtak)', 270, 5, 14, 22, 'gf_labeled'),
  ('recipe', 'Piletina na žaru s quinoom i salatom', 680, 62, 60, 20, 'gf_labeled'),
  -- Petak
  ('recipe', 'Jaja s avokadom i GF tostom', 620, 30, 45, 36, 'gf_labeled'),
  ('recipe', 'GF rižini krekeri + badem maslac', 280, 7, 28, 16, 'gf_labeled'),
  ('recipe', 'Svinjski fileti s batatom i graškom', 720, 54, 68, 22, 'gf_labeled'),
  ('recipe', 'Grčki jogurt s medom i orasima', 320, 20, 28, 14, 'gf_labeled'),
  ('recipe', 'Tuna salata s avokadom i krekerima', 580, 58, 28, 28, 'gf_labeled'),
  -- Subota (Meal Prep Dan)
  ('recipe', 'GF Oatmeal s jabukama i cimetom', 620, 46, 68, 16, 'gf_labeled'),
  ('recipe', 'Skuta s ananasom i chia', 260, 26, 24, 6, 'gf_labeled'),
  ('recipe', 'Pileća juha s povrćem i rižom', 660, 52, 60, 20, 'gf_labeled'),
  ('recipe', 'Sjemenke i kruška', 250, 8, 28, 12, 'gf_labeled'),
  ('recipe', 'Losos u foliji s rižom i povrćem', 680, 58, 60, 22, 'gf_labeled'),
  -- Nedjelja (Slobodni dan)
  ('recipe', 'Omlet s gljivama i feta sirom', 580, 40, 12, 42, 'gf_labeled'),
  ('recipe', 'Voćna salata s grčkim jogurtom', 280, 16, 36, 8, 'gf_labeled'),
  ('recipe', 'Beef bowl s rižom i avokadom', 780, 58, 68, 28, 'gf_labeled'),
  ('recipe', 'Orasi + GF tamna čokolada (Nedjelja)', 300, 6, 12, 26, 'gf_labeled'),
  ('recipe', 'GF piletina s GF pesto rezancima', 680, 58, 60, 22, 'gf_labeled');

-- Phase 4 seed: links each of the 35 recipe foods (supabase/seed.sql) to
-- its weekday + meal slot from the 7-day plan (docs/source-plan.pdf
-- Poglavlje 3). Matches by name since foods.id is a random UUID.
insert into plan_meals (weekday, meal_type, food_id)
select v.weekday, v.meal_type, f.id
from (values
  (0, 'obrok_1', 'GF Zobene pahuljice s bananama'),
  (0, 'snack_1', 'Grčki jogurt + borovnice + chia'),
  (0, 'obrok_2', 'Piletina s rižom i sotiranim povrćem'),
  (0, 'snack_2', 'Jabuka + kikiriki maslac'),
  (0, 'obrok_3', 'Losos s batatom i brokolijem'),
  (1, 'obrok_1', 'Omlet s avokadom i feta sirom'),
  (1, 'snack_1', 'Bademi + naranča'),
  (1, 'obrok_2', 'Quinoa bowl s tunom i povrćem'),
  (1, 'snack_2', 'Skuta s kruškama'),
  (1, 'obrok_3', 'Goveđe mesne kuglice s rižom'),
  (2, 'obrok_1', 'Smoothie zdjela'),
  (2, 'snack_1', '2 tvrdo kuhana jaja + jabuka'),
  (2, 'obrok_2', 'Pileći burito bowl (GF)'),
  (2, 'snack_2', 'Hummus s povrćem'),
  (2, 'obrok_3', 'Bakalar u pećnici s krumpirom'),
  (3, 'obrok_1', 'GF palačinke s jagodama'),
  (3, 'snack_1', 'Protein shake'),
  (3, 'obrok_2', 'Varivo od leće s piletinom'),
  (3, 'snack_2', 'Orasi + GF tamna čokolada (Četvrtak)'),
  (3, 'obrok_3', 'Piletina na žaru s quinoom i salatom'),
  (4, 'obrok_1', 'Jaja s avokadom i GF tostom'),
  (4, 'snack_1', 'GF rižini krekeri + badem maslac'),
  (4, 'obrok_2', 'Svinjski fileti s batatom i graškom'),
  (4, 'snack_2', 'Grčki jogurt s medom i orasima'),
  (4, 'obrok_3', 'Tuna salata s avokadom i krekerima'),
  (5, 'obrok_1', 'GF Oatmeal s jabukama i cimetom'),
  (5, 'snack_1', 'Skuta s ananasom i chia'),
  (5, 'obrok_2', 'Pileća juha s povrćem i rižom'),
  (5, 'snack_2', 'Sjemenke i kruška'),
  (5, 'obrok_3', 'Losos u foliji s rižom i povrćem'),
  (6, 'obrok_1', 'Omlet s gljivama i feta sirom'),
  (6, 'snack_1', 'Voćna salata s grčkim jogurtom'),
  (6, 'obrok_2', 'Beef bowl s rižom i avokadom'),
  (6, 'snack_2', 'Orasi + GF tamna čokolada (Nedjelja)'),
  (6, 'obrok_3', 'GF piletina s GF pesto rezancima')
) as v(weekday, meal_type, name)
join foods f on f.name = v.name and f.source = 'recipe';

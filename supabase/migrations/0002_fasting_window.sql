-- Phase 3: fasting (14:10) module. Window times live on profiles so they
-- can be edited in Settings if the user's schedule shifts (BUILD-LOOP-PROMPT
-- Phase 3 task 3) — defaults match docs/source-plan.pdf Poglavlje 2.
alter table profiles
  add column eating_window_start time not null default '10:00',
  add column eating_window_end time not null default '19:30';

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInAppTimezone, weekdayIndex, zonedDayRangeUtc } from "@/lib/timezone";
import { currentProgressionBlock } from "@/lib/workout";

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  instructions: string | null;
  repsTarget: string;
  rounds: number;
  restSeconds: number;
}

export interface TodaysWorkout {
  workoutDay: { id: string; focusName: string; durationMin: number };
  block: number;
  exercises: WorkoutExercise[];
  alreadyLoggedToday: boolean;
}

interface BlockProgression {
  rounds: number;
  rest_s: number;
}

interface WorkoutDayExerciseRow {
  id: string;
  order_index: number;
  reps_target: string;
  block_progression: Record<string, BlockProgression>;
  exercises: { id: string; name: string; muscle_group: string; instructions: string | null };
}

export async function getTodaysWorkout(): Promise<TodaysWorkout | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("program_start_date")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const dateStr = todayInAppTimezone();
  const weekday = weekdayIndex(dateStr);
  const block = currentProgressionBlock(profile.program_start_date, dateStr);

  const { data: workoutDay } = await supabase
    .from("workout_days")
    .select("id, focus_name, duration_min")
    .eq("weekday", weekday)
    .single();
  if (!workoutDay) return null;

  const { data: dayExercises } = await supabase
    .from("workout_day_exercises")
    .select("id, order_index, reps_target, block_progression, exercises(id, name, muscle_group, instructions)")
    .eq("workout_day_id", workoutDay.id)
    .order("order_index", { ascending: true });

  const exercises: WorkoutExercise[] = ((dayExercises as unknown as WorkoutDayExerciseRow[]) ?? [])
    .filter((row) => row.exercises)
    .map((row) => {
      const progression = row.block_progression[String(block)];
      return {
        id: row.id,
        exerciseId: row.exercises.id,
        name: row.exercises.name,
        muscleGroup: row.exercises.muscle_group,
        instructions: row.exercises.instructions,
        repsTarget: row.reps_target,
        rounds: progression?.rounds ?? 3,
        restSeconds: progression?.rest_s ?? 30,
      };
    });

  const { start, end } = zonedDayRangeUtc(dateStr);
  const { data: todaysLogs } = await supabase
    .from("workout_logs")
    .select("id")
    .eq("profile_id", user.id)
    .eq("workout_day_id", workoutDay.id)
    .gte("logged_at", start.toISOString())
    .lt("logged_at", end.toISOString());

  return {
    workoutDay: {
      id: workoutDay.id,
      focusName: workoutDay.focus_name,
      durationMin: workoutDay.duration_min,
    },
    block,
    exercises,
    alreadyLoggedToday: (todaysLogs ?? []).length > 0,
  };
}

export interface WorkoutLogSummary {
  id: string;
  loggedAt: string;
  focusName: string;
  durationSeconds: number | null;
  roundsCompleted: number | null;
  perceivedEffort: number | null;
}

interface WorkoutLogRow {
  id: string;
  logged_at: string;
  duration_seconds: number | null;
  rounds_completed: number | null;
  perceived_effort: number | null;
  workout_days: { focus_name: string } | null;
}

export async function getRecentWorkoutLogs(limit = 5): Promise<WorkoutLogSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("workout_logs")
    .select(
      "id, logged_at, duration_seconds, rounds_completed, perceived_effort, workout_days(focus_name)"
    )
    .eq("profile_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(limit);

  return ((data as unknown as WorkoutLogRow[]) ?? []).map((row) => ({
    id: row.id,
    loggedAt: row.logged_at,
    focusName: row.workout_days?.focus_name ?? "Workout",
    durationSeconds: row.duration_seconds,
    roundsCompleted: row.rounds_completed,
    perceivedEffort: row.perceived_effort,
  }));
}

export async function logWorkout(input: {
  workoutDayId: string;
  durationSeconds: number;
  roundsCompleted: number;
  perceivedEffort: number;
}): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error: logError } = await supabase.from("workout_logs").insert({
    profile_id: user.id,
    workout_day_id: input.workoutDayId,
    duration_seconds: input.durationSeconds,
    rounds_completed: input.roundsCompleted,
    perceived_effort: input.perceivedEffort,
    completed: true,
  });
  if (logError) return { ok: false, message: "Couldn't save the workout. Try again." };

  const dateStr = todayInAppTimezone();
  await supabase.from("daily_activity").upsert(
    {
      profile_id: user.id,
      activity_date: dateStr,
      workout_completed: true,
    },
    { onConflict: "profile_id,activity_date" }
  );

  revalidatePath("/");
  revalidatePath("/train");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInAppTimezone } from "@/lib/timezone";
import {
  computeAdjustmentSuggestions,
  type AdjustmentSuggestion,
  type AdjustmentType,
} from "@/lib/adjustment";
import { computeProgramProgress } from "@/lib/program-progress";

export async function logWeight(input: {
  dateStr: string;
  weightKg: number;
  note?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("weight_logs").upsert(
    {
      profile_id: user.id,
      logged_at: input.dateStr,
      weight_kg: input.weightKg,
      note: input.note ?? null,
    },
    { onConflict: "profile_id,logged_at" }
  );
  if (error) return { ok: false, message: "Couldn't save weight. Try again." };

  revalidatePath("/");
  revalidatePath("/progress");
  return { ok: true };
}

export async function logBodyMeasurement(input: {
  dateStr: string;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  bicepsCm?: number;
  thighCm?: number;
  note?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("body_measurements").insert({
    profile_id: user.id,
    logged_at: input.dateStr,
    waist_cm: input.waistCm ?? null,
    chest_cm: input.chestCm ?? null,
    hips_cm: input.hipsCm ?? null,
    biceps_cm: input.bicepsCm ?? null,
    thigh_cm: input.thighCm ?? null,
    note: input.note ?? null,
  });
  if (error) return { ok: false, message: "Couldn't save measurements. Try again." };

  revalidatePath("/progress");
  return { ok: true };
}

export async function uploadProgressPhoto(
  angle: "front" | "side" | "back",
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a photo first." };
  }

  const dateStr = todayInAppTimezone();
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${user.id}/${dateStr}-${angle}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { ok: false, message: "Couldn't upload the photo. Try again." };

  const { error: insertError } = await supabase.from("progress_photos").insert({
    profile_id: user.id,
    logged_at: dateStr,
    storage_path: path,
    angle,
  });
  if (insertError) return { ok: false, message: "Photo uploaded but couldn't save the record." };

  revalidatePath("/progress");
  return { ok: true };
}

export interface ProgressPhotoEntry {
  id: string;
  loggedAt: string;
  angle: string;
  signedUrl: string | null;
}

export async function getRecentProgressPhotos(limit = 6): Promise<ProgressPhotoEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("progress_photos")
    .select("id, logged_at, angle, storage_path")
    .eq("profile_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const signed = await Promise.all(
    rows.map((row) =>
      supabase.storage.from("progress-photos").createSignedUrl(row.storage_path, 3600)
    )
  );

  return rows.map((row, i) => ({
    id: row.id,
    loggedAt: row.logged_at,
    angle: row.angle,
    signedUrl: signed[i].data?.signedUrl ?? null,
  }));
}

export interface WeightPoint {
  date: string;
  weightKg: number;
  rollingAvgKg: number;
}

export async function getWeightHistory(daysBack = 90): Promise<WeightPoint[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("weight_logs")
    .select("logged_at, weight_kg")
    .eq("profile_id", user.id)
    .gte("logged_at", sinceStr)
    .order("logged_at", { ascending: true });

  const rows = (data ?? []).map((r) => ({
    date: r.logged_at as string,
    weightKg: Number(r.weight_kg),
  }));

  return rows.map((row, i) => {
    const rowTime = new Date(`${row.date}T00:00:00Z`).getTime();
    const windowPoints = rows
      .slice(0, i + 1)
      .filter((r) => {
        const diffDays =
          (rowTime - new Date(`${r.date}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000);
        return diffDays >= 0 && diffDays <= 6;
      })
      .map((r) => r.weightKg);
    const rollingAvgKg =
      windowPoints.reduce((sum, w) => sum + w, 0) / windowPoints.length;
    return { date: row.date, weightKg: row.weightKg, rollingAvgKg };
  });
}

export interface WeightSummary {
  currentWeightKg: number | null;
  startingWeightKg: number;
  goalWeightKg: number;
  weightLostKg: number;
  weightRemainingKg: number;
  percentToGoal: number;
  avgKgPerWeek: number;
}

// Reuses computeProgramProgress (lib/program-progress.ts) rather than
// re-deriving lost/remaining/percent — this just adds the raw
// current/starting/goal weight numbers the Progress hero needs on top.
export async function getWeightSummary(): Promise<WeightSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("program_start_date, starting_weight_kg, goal_weight_kg")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const { data: latestWeight } = await supabase
    .from("weight_logs")
    .select("weight_kg")
    .eq("profile_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentWeightKg = latestWeight ? Number(latestWeight.weight_kg) : null;
  const progress = computeProgramProgress(
    profile.program_start_date,
    todayInAppTimezone(),
    profile.starting_weight_kg,
    profile.goal_weight_kg,
    currentWeightKg ?? profile.starting_weight_kg
  );

  const weeksElapsed = progress.daysElapsed / 7;
  const avgKgPerWeek =
    weeksElapsed >= 1 ? Math.round((progress.weightLostKg / weeksElapsed) * 100) / 100 : 0;

  return {
    currentWeightKg,
    startingWeightKg: Number(profile.starting_weight_kg),
    goalWeightKg: Number(profile.goal_weight_kg),
    weightLostKg: progress.weightLostKg,
    weightRemainingKg: progress.weightRemainingKg,
    percentToGoal: progress.percentToGoal,
    avgKgPerWeek,
  };
}

export interface MeasurementStat {
  key: "waist" | "chest" | "hips" | "biceps" | "thigh";
  label: string;
  currentCm: number | null;
  deltaCm: number | null;
}

const MEASUREMENT_FIELDS = [
  { column: "waist_cm", key: "waist", label: "Waist" },
  { column: "chest_cm", key: "chest", label: "Chest" },
  { column: "hips_cm", key: "hips", label: "Hips" },
  { column: "biceps_cm", key: "biceps", label: "Biceps" },
  { column: "thigh_cm", key: "thigh", label: "Thigh" },
] as const;

// Body measurements are logged as sparse rows (a session might only fill
// in a couple of fields) — this scans the recent history per field for
// the latest value and the one before it, rather than assuming any two
// consecutive rows both have every field populated.
export async function getMeasurementStats(): Promise<MeasurementStat[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("body_measurements")
    .select("logged_at, waist_cm, chest_cm, hips_cm, biceps_cm, thigh_cm")
    .eq("profile_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(20);

  const rows = data ?? [];

  return MEASUREMENT_FIELDS.map(({ column, key, label }) => {
    const values = rows
      .map((r) => r[column as keyof typeof r])
      .filter((v): v is number => v !== null && v !== undefined)
      .map(Number);
    const [current, previous] = values;
    return {
      key,
      label,
      currentCm: current ?? null,
      deltaCm:
        current !== undefined && previous !== undefined
          ? Math.round((current - previous) * 10) / 10
          : null,
    };
  });
}

export async function getAdjustmentSuggestions(): Promise<AdjustmentSuggestion[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const weightRolling = await getWeightHistory(30);

  const { data: activityRows } = await supabase
    .from("daily_activity")
    .select("activity_date, energy_level")
    .eq("profile_id", user.id)
    .not("energy_level", "is", null)
    .gte("activity_date", sinceStr)
    .order("activity_date", { ascending: true });

  const energyHistory = (activityRows ?? []).map((r) => ({
    date: r.activity_date as string,
    energyLevel: Number(r.energy_level),
  }));

  const { data: workoutRows } = await supabase
    .from("workout_logs")
    .select("logged_at, perceived_effort")
    .eq("profile_id", user.id)
    .not("perceived_effort", "is", null)
    .gte("logged_at", since.toISOString())
    .order("logged_at", { ascending: true });

  const effortHistory = (workoutRows ?? []).map((r) => ({
    date: r.logged_at as string,
    perceivedEffort: Number(r.perceived_effort),
  }));

  return computeAdjustmentSuggestions({ weightRolling, energyHistory, effortHistory });
}

export async function applyAdjustment(
  type: AdjustmentType,
  deltaKcal: number,
  reason: string
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("deficit_kcal")
    .eq("id", user.id)
    .single();
  if (!profile) return { ok: false, message: "Couldn't load profile." };

  // Suggestions raise the target by lowering the deficit and vice versa —
  // deltaKcal is expressed as the change to the calorie target.
  const newDeficit = Math.max(profile.deficit_kcal - deltaKcal, 0);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ deficit_kcal: newDeficit })
    .eq("id", user.id);
  if (updateError) return { ok: false, message: "Couldn't apply the adjustment. Try again." };

  await supabase.from("custom_metrics").insert({
    profile_id: user.id,
    metric_name: "deficit_adjustment",
    value: newDeficit,
    unit: "kcal",
    note: `${type}: ${reason} (${deltaKcal > 0 ? "+" : ""}${deltaKcal} kcal target)`,
  });

  revalidatePath("/");
  revalidatePath("/progress");
  return { ok: true };
}

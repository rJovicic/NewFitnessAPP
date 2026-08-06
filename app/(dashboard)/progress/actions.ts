"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInAppTimezone } from "@/lib/timezone";
import {
  computeAdjustmentSuggestions,
  type AdjustmentSuggestion,
  type AdjustmentType,
} from "@/lib/adjustment";

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

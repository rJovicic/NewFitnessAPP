import { createClient } from "@/lib/supabase/server";
import { calculateAge, calculateTargets } from "@/lib/macros";

export interface DashboardData {
  fullName: string;
  targets: {
    targetKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  logged: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  water: { ml: number; targetMl: number };
  steps: { count: number; targetCount: number };
}

// "Today" here uses the server's UTC calendar day — an acceptable
// placeholder for Phase 2, where this mostly returns zeros anyway (no
// logging UI exists yet). Phase 3/4 need a real timezone-aware day
// boundary (tied to the fasting window), noted in CLAUDE.md Parking Lot.
export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, date_of_birth, height_cm, starting_weight_kg, activity_factor, protein_g_per_kg, deficit_kcal"
    )
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

  const weightKg = latestWeight?.weight_kg ?? profile.starting_weight_kg;
  const age = calculateAge(profile.date_of_birth);
  const targets = calculateTargets(profile, weightKg, age);

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const { data: todaysItems } = await supabase
    .from("meal_items")
    .select("kcal, protein_g, carbs_g, fat_g, meal_logs!inner(profile_id, logged_at)")
    .eq("meal_logs.profile_id", user.id)
    .gte("meal_logs.logged_at", todayStart.toISOString())
    .lt("meal_logs.logged_at", todayEnd.toISOString());

  const logged = (todaysItems ?? []).reduce(
    (acc, item) => ({
      kcal: acc.kcal + Number(item.kcal),
      proteinG: acc.proteinG + Number(item.protein_g),
      carbsG: acc.carbsG + Number(item.carbs_g),
      fatG: acc.fatG + Number(item.fat_g),
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const todayDate = todayStart.toISOString().slice(0, 10);
  const { data: activity } = await supabase
    .from("daily_activity")
    .select("water_ml, steps")
    .eq("profile_id", user.id)
    .eq("activity_date", todayDate)
    .maybeSingle();

  return {
    fullName: profile.full_name ?? "there",
    targets: {
      targetKcal: Math.round(targets.targetKcal),
      proteinG: Math.round(targets.proteinG),
      carbsG: Math.round(targets.carbsG),
      fatG: Math.round(targets.fatG),
    },
    logged: {
      kcal: Math.round(logged.kcal),
      proteinG: Math.round(logged.proteinG),
      carbsG: Math.round(logged.carbsG),
      fatG: Math.round(logged.fatG),
    },
    water: { ml: activity?.water_ml ?? 0, targetMl: 3000 },
    steps: { count: activity?.steps ?? 0, targetCount: 10000 },
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInAppTimezone, zonedDayRangeUtc } from "@/lib/timezone";

// Phase 9 smoke test: proves the add-on extension point (CLAUDE.md §7)
// end-to-end using only custom_metrics — no migration, no changes to
// dashboard-data.ts or any other core file.
const METRIC_NAME = "morning_mood";

export async function getTodaysMood(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { start, end } = zonedDayRangeUtc(todayInAppTimezone());
  const { data } = await supabase
    .from("custom_metrics")
    .select("value")
    .eq("profile_id", user.id)
    .eq("metric_name", METRIC_NAME)
    .gte("logged_at", start.toISOString())
    .lt("logged_at", end.toISOString())
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? Number(data.value) : null;
}

export async function logMood(value: number): Promise<{ ok: boolean }> {
  if (value < 1 || value > 5) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.from("custom_metrics").insert({
    profile_id: user.id,
    metric_name: METRIC_NAME,
    value,
    unit: "1-5 scale",
  });

  revalidatePath("/");
  revalidatePath("/mood");
  return { ok: true };
}

import { createClient } from "@/lib/supabase/server";
import { zonedDayRangeUtc } from "@/lib/timezone";

export interface SyncedDailyMetrics {
  steps: number | null;
  sleepHours: number | null;
}

// Steps/sleep for dashboard tiles and the daily checklist prefer this —
// synced from the Phase 8 webhook — over the Phase 7 manual entry, per
// BUILD-LOOP-PROMPT.md Phase 8 task 3. Null means nothing synced for
// that day yet, so the caller should fall back to daily_activity.
export async function getSyncedDailyMetrics(
  profileId: string,
  dateStr: string
): Promise<SyncedDailyMetrics> {
  const supabase = await createClient();
  const { start, end } = zonedDayRangeUtc(dateStr);

  const { data } = await supabase
    .from("health_metrics")
    .select("metric_type, value")
    .eq("profile_id", profileId)
    .in("metric_type", ["steps", "sleep_hours"])
    .gte("recorded_at", start.toISOString())
    .lt("recorded_at", end.toISOString());

  const rows = data ?? [];
  const stepsRows = rows.filter((r) => r.metric_type === "steps");
  const sleepRows = rows.filter((r) => r.metric_type === "sleep_hours");

  return {
    steps: stepsRows.length > 0 ? stepsRows.reduce((sum, r) => sum + Number(r.value), 0) : null,
    sleepHours:
      sleepRows.length > 0 ? sleepRows.reduce((sum, r) => sum + Number(r.value), 0) : null,
  };
}

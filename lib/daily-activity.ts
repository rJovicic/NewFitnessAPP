import { createClient } from "@/lib/supabase/server";
import { computeFastingHonored } from "@/lib/fasting";
import { zonedDayRangeUtc } from "@/lib/timezone";

/**
 * Recomputes daily_activity.fasting_window_honored for one profile/date
 * from that day's actual meal_logs. Not yet called from any user flow —
 * Phase 4 (meal logging) needs to call this after every meal log create
 * and delete, once that UI exists. Verified directly against test data
 * for Phase 3's STOP gate (see CLAUDE.md session log).
 */
export async function recomputeFastingHonored(
  profileId: string,
  dateStr: string,
  windowStart: string,
  windowEnd: string
): Promise<boolean | null> {
  const supabase = await createClient();
  const { start, end } = zonedDayRangeUtc(dateStr);

  const { data: meals } = await supabase
    .from("meal_logs")
    .select("logged_at")
    .eq("profile_id", profileId)
    .gte("logged_at", start.toISOString())
    .lt("logged_at", end.toISOString());

  // No meals logged yet today — nothing to honor or violate.
  const honored =
    meals && meals.length > 0
      ? computeFastingHonored(
          meals.map((m) => new Date(m.logged_at)),
          dateStr,
          windowStart,
          windowEnd
        )
      : null;

  await supabase
    .from("daily_activity")
    .upsert(
      { profile_id: profileId, activity_date: dateStr, fasting_window_honored: honored },
      { onConflict: "profile_id,activity_date" }
    );

  return honored;
}

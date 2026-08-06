import { zonedTimeToUtc } from "@/lib/timezone";

// Not a PDF spec — a reasonable default so a meal logged a few minutes
// either side of the window doesn't spuriously flip the flag.
export const FASTING_GRACE_MINUTES = 15;

/**
 * True if every meal timestamp falls within the eating window (+/- grace)
 * for the given local date. Call with a non-empty list — an empty day has
 * no window to honor or violate, which callers should treat as "not
 * applicable" rather than true/false (see recomputeFastingHonored).
 */
export function computeFastingHonored(
  mealTimestamps: Date[],
  dateStr: string,
  windowStart: string,
  windowEnd: string,
  graceMinutes: number = FASTING_GRACE_MINUTES
): boolean {
  const graceMs = graceMinutes * 60_000;
  const start = zonedTimeToUtc(dateStr, windowStart).getTime() - graceMs;
  const end = zonedTimeToUtc(dateStr, windowEnd).getTime() + graceMs;

  return mealTimestamps.every((t) => {
    const ms = t.getTime();
    return ms >= start && ms <= end;
  });
}

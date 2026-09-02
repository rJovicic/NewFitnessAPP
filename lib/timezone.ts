// Single source of truth for "what day/time is it" across the app.
// Single-user app, no timezone picker — Robert is in Croatia. If that
// ever changes, this is the one place to update (and the profiles table
// would need its own timezone column at that point).
export const APP_TIMEZONE = "Europe/Zagreb";

/** Today's calendar date (YYYY-MM-DD) in APP_TIMEZONE. */
export function todayInAppTimezone(referenceDate: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(
    referenceDate
  );
}

/** The current hour (0-23) in APP_TIMEZONE, for time-of-day greetings. */
export function currentHourInAppTimezone(referenceDate: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(referenceDate);
  return parseInt(hour, 10);
}

/**
 * The [start, end) UTC instants for a given local calendar date in
 * APP_TIMEZONE — use this to query timestamptz columns (meal_logs.logged_at
 * etc.) for "everything that happened on this local day," which is not the
 * same range as the UTC calendar day.
 */
export function zonedDayRangeUtc(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guessUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const offsetMinutes = tzOffsetMinutesAt(guessUtc, APP_TIMEZONE);
  const start = new Date(guessUtc.getTime() - offsetMinutes * 60_000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Minutes to ADD to a UTC instant to get local time in `timeZone`, at that instant. */
function tzOffsetMinutesAt(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const asUtc = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );
  return (asUtc - date.getTime()) / 60_000;
}

/** Converts a "HH:MM" local time on a given local date (APP_TIMEZONE) to a UTC instant. */
export function zonedTimeToUtc(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const [y, mo, d] = dateStr.split("-").map(Number);
  const guessUtc = new Date(Date.UTC(y, mo - 1, d, h, m, 0));
  const offsetMinutes = tzOffsetMinutesAt(guessUtc, APP_TIMEZONE);
  return new Date(guessUtc.getTime() - offsetMinutes * 60_000);
}

/**
 * Calendar date string (YYYY-MM-DD) `days` before today, computed in
 * APP_TIMEZONE. Pure calendar-day subtraction anchored to the app's fixed
 * timezone — safe to call from a client component since it never touches
 * the viewer's own local clock/timezone, only re-derives "today" via
 * todayInAppTimezone() and subtracts whole days from that.
 */
export function dateNDaysAgoInAppTimezone(days: number, referenceDate: Date = new Date()): string {
  const todayStr = todayInAppTimezone(referenceDate);
  const [y, m, d] = todayStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
}

/** Monday-first weekday index (0-6) for a YYYY-MM-DD date string. */
export function weekdayIndex(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return (d.getUTCDay() + 6) % 7;
}

/** The 7 dates (Monday-first, YYYY-MM-DD) of the week containing `referenceDateStr`. */
export function getWeekDates(referenceDateStr: string): string[] {
  const ref = new Date(`${referenceDateStr}T00:00:00Z`);
  const dayOfWeek = (ref.getUTCDay() + 6) % 7; // 0 = Monday
  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() - dayOfWeek);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

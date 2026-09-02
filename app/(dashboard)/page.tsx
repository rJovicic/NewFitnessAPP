import { getDashboardData } from "@/lib/dashboard-data";
import { dashboardTiles } from "@/lib/tile-registry";
import { APP_TIMEZONE, currentHourInAppTimezone, todayInAppTimezone } from "@/lib/timezone";
import { PageHeader } from "@/components/fitness/page-header";
import { SectionHeader } from "@/components/fitness/section-header";
import { DayStrip } from "@/components/day-strip";
import { CalorieHero } from "@/components/calorie-hero";
import { DailyChecklist } from "@/components/daily-checklist";
import { getDailyChecklist } from "./checklist-actions";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// The Home layout composes specific tiles by id into a deliberate
// editorial arrangement (see globals.css's art-direction note) rather
// than looping the registry into a generic card grid. Anything NOT named
// here still renders automatically at the end — so a tile registered
// later (CLAUDE.md §7) is never silently dropped, it just lands in a
// plain fallback section instead of a hand-placed one.
const NAMED_TILE_IDS = new Set([
  "water",
  "steps",
  "streak",
  "mood",
  "weekly-summary",
  "program-progress",
  "fasting",
]);

function tileById(id: string) {
  return dashboardTiles.find((tile) => tile.id === id);
}

function greetingFor(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const todayDate = todayInAppTimezone();
  const selectedDate = date && DATE_PATTERN.test(date) ? date : todayDate;
  const isToday = selectedDate === todayDate;

  const [data, checklist] = await Promise.all([
    getDashboardData(selectedDate),
    isToday ? getDailyChecklist() : Promise.resolve(null),
  ]);

  if (!data) {
    return (
      <p className="px-4 py-8 text-center text-muted-foreground">
        Couldn&apos;t load your data. Try refreshing.
      </p>
    );
  }

  const now = new Date();
  const greeting = greetingFor(currentHourInAppTimezone(now));
  const dateLabel = now.toLocaleDateString("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const firstName = data.fullName.split(" ")[0];

  const waterTile = tileById("water");
  const stepsTile = tileById("steps");
  const streakTile = tileById("streak");
  const moodTile = tileById("mood");
  const weeklySummaryTile = tileById("weekly-summary");
  const programProgressTile = tileById("program-progress");
  const fastingTile = tileById("fasting");
  const otherTiles = dashboardTiles.filter((tile) => !NAMED_TILE_IDS.has(tile.id));

  return (
    // No wrapping cards or tonal boxes left — each section below carries
    // its own border-t rule + vertical padding as the divider, so the
    // page reads as one composed flow (heading -> primary -> divider ->
    // secondary) rather than a stack of containers. See the art-direction
    // reset note atop globals.css.
    <div className="flex flex-col">
      <PageHeader title={`${greeting}, ${firstName}`} subtitle={dateLabel} />
      <DayStrip selectedDate={selectedDate} todayDate={todayDate} />

      <CalorieHero data={data} />

      {(waterTile || stepsTile) && (
        <section className="flex flex-col border-t border-border px-4 pt-6 pb-6">
          {isToday && <SectionHeader title="Today" />}
          {waterTile?.render(data)}
          {stepsTile?.render(data)}
        </section>
      )}

      {isToday && checklist && (
        <section className="border-t border-border px-4 pt-6 pb-6">
          <DailyChecklist data={checklist} />
        </section>
      )}

      <section className="flex flex-col gap-4 border-t border-border px-4 pt-6 pb-8">
        <SectionHeader title="This week" />
        {programProgressTile?.render(data)}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4">
          {streakTile?.render(data)}
          {moodTile?.render(data)}
          {weeklySummaryTile?.render(data)}
        </div>
        <div className="border-t border-border">{fastingTile?.render(data)}</div>
      </section>

      {otherTiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-t border-border px-4 pt-6">
          {otherTiles.map((tile) => (
            <div key={tile.id} className={tile.span === "full" ? "col-span-2" : ""}>
              {tile.render(data)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

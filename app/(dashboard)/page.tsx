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

// Only the two metrics with an explicit daily target (water, steps) sit in
// the primary grid directly under the hero — streak/mood/weekly-summary/
// program-progress/fasting are reflective or derived rather than "today's
// numbers," so they read as secondary, below the checklist. Everything
// not listed here lands in the secondary group by default, so a newly
// registered tile still shows up without this file knowing about it. See
// lib/tile-registry.tsx.
const PRIMARY_METRIC_IDS = new Set(["water", "steps"]);

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

  const metricTiles = dashboardTiles.filter((tile) => PRIMARY_METRIC_IDS.has(tile.id));
  const summaryTiles = dashboardTiles.filter((tile) => !PRIMARY_METRIC_IDS.has(tile.id));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`${greeting}, ${firstName}`} subtitle={dateLabel} />
      <DayStrip selectedDate={selectedDate} todayDate={todayDate} />

      <CalorieHero data={data} />

      <div className="grid grid-cols-2 gap-3 px-4">
        {metricTiles.map((tile) => (
          <div key={tile.id} className={tile.span === "full" ? "col-span-2" : ""}>
            {tile.render(data)}
          </div>
        ))}
      </div>

      {isToday && checklist && (
        <div className="flex flex-col gap-3 px-4">
          <SectionHeader title="Today's checklist" />
          <DailyChecklist data={checklist} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 px-4">
        {summaryTiles.map((tile) => (
          <div key={tile.id} className={tile.span === "full" ? "col-span-2" : ""}>
            {tile.render(data)}
          </div>
        ))}
      </div>
    </div>
  );
}

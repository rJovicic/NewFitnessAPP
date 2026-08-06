import { getDashboardData } from "@/lib/dashboard-data";
import { dashboardTiles } from "@/lib/tile-registry";
import { todayInAppTimezone } from "@/lib/timezone";
import { DayStrip } from "@/components/day-strip";
import { CalorieRing } from "@/components/calorie-ring";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const todayDate = todayInAppTimezone();
  const selectedDate = date && DATE_PATTERN.test(date) ? date : todayDate;

  const data = await getDashboardData(selectedDate);

  if (!data) {
    return (
      <p className="px-4 py-8 text-center text-muted-foreground">
        Couldn&apos;t load your data. Try refreshing.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DayStrip selectedDate={selectedDate} todayDate={todayDate} />

      <CalorieRing
        loggedKcal={data.logged.kcal}
        targetKcal={data.targets.targetKcal}
      />

      <div className="grid grid-cols-2 gap-3 px-4">
        {dashboardTiles.map((tile) => (
          <div
            key={tile.id}
            className={tile.span === "full" ? "col-span-2" : ""}
          >
            {tile.render(data)}
          </div>
        ))}
      </div>
    </div>
  );
}

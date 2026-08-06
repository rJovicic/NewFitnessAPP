import { getDashboardData } from "@/lib/dashboard-data";
import { dashboardTiles } from "@/lib/tile-registry";
import { DayStrip } from "@/components/day-strip";
import { CalorieRing } from "@/components/calorie-ring";

export default async function DashboardHome() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <p className="px-4 py-8 text-center text-muted-foreground">
        Couldn&apos;t load your data. Try refreshing.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DayStrip />

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

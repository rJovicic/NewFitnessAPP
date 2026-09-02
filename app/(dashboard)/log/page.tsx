import { LogScreen } from "@/components/log-screen";
import { PageHeader } from "@/components/fitness/page-header";
import { getDashboardData } from "@/lib/dashboard-data";
import { APP_TIMEZONE, todayInAppTimezone } from "@/lib/timezone";
import { getTodaysPlanMeals, getTodaysCustomMeals } from "./actions";

export default async function LogPage() {
  const [planMeals, loggedMeals, dashboardData] = await Promise.all([
    getTodaysPlanMeals(),
    getTodaysCustomMeals(),
    getDashboardData(todayInAppTimezone()),
  ]);

  const dateLabel = new Date().toLocaleDateString("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col">
      <PageHeader title="Food" subtitle={dateLabel} />
      <LogScreen
        planMeals={planMeals}
        loggedMeals={loggedMeals}
        loggedKcal={dashboardData?.logged.kcal ?? 0}
        targetKcal={dashboardData?.targets.targetKcal ?? 0}
      />
    </div>
  );
}

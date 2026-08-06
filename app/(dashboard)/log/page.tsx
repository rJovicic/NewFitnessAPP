import { LogScreen } from "@/components/log-screen";
import { getTodaysPlanMeals, getTodaysCustomMeals } from "./actions";

export default async function LogPage() {
  const [planMeals, loggedMeals] = await Promise.all([
    getTodaysPlanMeals(),
    getTodaysCustomMeals(),
  ]);
  return <LogScreen planMeals={planMeals} loggedMeals={loggedMeals} />;
}

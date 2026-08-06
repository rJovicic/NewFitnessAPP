import { LogScreen } from "@/components/log-screen";
import { getTodaysPlanMeals } from "./actions";

export default async function LogPage() {
  const planMeals = await getTodaysPlanMeals();
  return <LogScreen planMeals={planMeals} />;
}

import { Flame } from "lucide-react";
import { MetricCard } from "@/components/fitness/metric-card";

export function StreakTile({ streak }: { streak: number }) {
  return (
    <MetricCard
      tone="calories"
      icon={Flame}
      label="Streak"
      value={streak}
      unit="days"
    />
  );
}
